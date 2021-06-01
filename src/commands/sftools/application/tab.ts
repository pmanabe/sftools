import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson,asJsonArray,ensureJsonMap } from '@salesforce/ts-types';

var xl = require('excel4node');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sftools', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('tabcommandDescription');

  public static examples = [
  `$ sfdx sftools:application:tab -u sandboxalias -p /Users/pmanabe/Downloads/Tabs.xlsx`
  ];

  public static args = [{path: 'path'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    path: flags.string({
      char: "p",
      description: messages.getMessage("pathFlagDescription"),
    }),
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;
  

  public async run(): Promise<AnyJson> {

    const filePath =
      this.flags.path || "Tabs.xlsx";
    
      // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();
    const customAppQuery = '/services/data/v51.0/tooling/query?q=select+Label,Description,DeveloperName,UiType+from+CustomApplication';
    const tabQuery = '/services/data/v51.0/tabs';
    
    interface customAppRes {
      size: number;
      totalSize: number;
      records: Array<CustomApplicationItem>;
    }
    
    // The type we are querying for
    interface CustomApplicationItem {
      Label: string;
      Description: string;
      DeveloperName: string;
      UiType: string;
    }

    interface appMetadataRes {
      size: number;
      records: Array<CustomApplication>;
    }

    interface CustomApplication {
      Metadata: Metadata;
    }

    interface Metadata {
      description: string;
      label: string;
      tabs: Array<string>;
    }

    interface Tab {
      label: string;
      name: string;
      sobjectName: string ;
      custom: boolean;
    }

    const uniqueTab = new Array<string>();
    const tabMap = new Map<string, string[]>();
    const tabMetadata = new Map<string, Tab>();

    // Query the org

    const tabResult = await conn.request(tabQuery);
    asJsonArray(tabResult).forEach(item => {
      // type of item -> `AnyJson`
      const record = ensureJsonMap(item);
      let tab = {label: record.label, name: record.name, sobjectName: record.sobjectName, custom: record.custom};
      tabMetadata.set(record.name,tab);
    });

    const customAppResult = await conn.request(customAppQuery);
    var sCustomAppRef = (customAppResult as unknown) as customAppRes;
    for (var i = 0; i < sCustomAppRef.totalSize; i++) {
    //for (var i = 0; i < 2; i++) {
      this.ux.log('Processing: '+(i+1)+' of '+ sCustomAppRef.totalSize + ' Custom Application.');
      const appMetadataQuery = "/services/data/v51.0/tooling/query?q=select+Metadata+from+CustomApplication+Where+DeveloperName+='" + sCustomAppRef.records[i].DeveloperName +"'";
      const appMetadataResult = await conn.request(appMetadataQuery);
      var sAppMetadataRef = (appMetadataResult as unknown) as appMetadataRes;
      sAppMetadataRef.records[0].Metadata.tabs.forEach(element => {
        uniqueTab.push(element);
        if(tabMap.get(element) == null){
          tabMap.set(element,new Array<string>());
        }
        tabMap.get(element).push(sCustomAppRef.records[i].DeveloperName);
      });
      //this.ux.log(sAppMetadataRef.records[0].Metadata.tabs.toString());
    }
    const distinctArray = uniqueTab.filter((n, i) => uniqueTab.indexOf(n) === i);
    //this.ux.log(distinctArray.toString());

    this.ux.log('=== Excel file creation process start ===');
    // Create a new instance of a Workbook class
    var wb = new xl.Workbook();
    var ws =  wb.addWorksheet('ApplicationTab');

    // Create a reusable style
    var centerAlignStyle = wb.createStyle({
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
    });

    var headerStyle = wb.createStyle({
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
      font: {
        color: '#FFFFFF',
        size: 12 
    }, 
    fill: {
        type: 'pattern',  
        patternType: 'solid', 
        fgColor: '#08344D'  
    }
    });

    var wrap = wb.createStyle({ 
      alignment: {
        wrapText: true,
        vertical: 'center'
      },
    });

    //columns header
    ws.cell(1,1,3,1,true).string('Label').style(headerStyle);
    ws.cell(1,2,3,2,true).string('DeveloperName').style(headerStyle);
    ws.cell(1,3,3,3,true).string('UiType').style(headerStyle);
    ws.cell(1,4,3,4,true).string('Description').style(headerStyle);
    ws.cell(1,5,3,5,true).string('Tab Qty').style(headerStyle);

    ws.column(1).setWidth(12);
    ws.column(2).setWidth(20);
    ws.column(3).setWidth(12);
    ws.column(4).setWidth(15);
    ws.column(5).setWidth(12);

    for(var x = 0; x< distinctArray.length; x++){
      var tab = tabMetadata.get(distinctArray[x]);
      //TODO fix to dynamicaly count records for each column
      //ws.cell(1,x+5).formula('COUNTIF(E4:E71,"✔")').style(centerAlignStyle);
      var name;
      var label;
      if(tab){
        name = tab.name;
        label = tab.label;
      } else {
        name = distinctArray[x];
        label = distinctArray[x];
      }
      ws.column(x+6).setWidth(15);
      ws.cell(1,x+6).style(headerStyle);
      ws.cell(2,x+6).string(name).style(headerStyle);
      ws.cell(3,x+6).string(label).style(headerStyle);
    }

    //rows
    for(var y = 0; y< sCustomAppRef.totalSize; y++){
      var uiType;
      var desc;
      if(sCustomAppRef.records[y].UiType){
        uiType = sCustomAppRef.records[y].UiType;
      } else {
        uiType = 'Classic';
      }

      if(sCustomAppRef.records[y].Description){
        desc = sCustomAppRef.records[y].Description;
      } else {
        desc = '';
      }

      ws.cell(y+4,1).string(sCustomAppRef.records[y].Label).style(wrap);
      ws.cell(y+4,2).string(sCustomAppRef.records[y].DeveloperName).style(wrap);
      ws.cell(y+4,3).string(uiType).style(wrap);
      ws.cell(y+4,4).string(desc).style(wrap);
      ws.cell(y+4,5).formula('COUNTIF(F'+(y+4)+':IT'+(y+4)+',"✔")').style(wrap);

      //columns
      for(var x = 0; x< distinctArray.length; x++){
        const map = tabMap.get(distinctArray[x]);
        const key = sCustomAppRef.records[y].DeveloperName;
        if(map.find(x => x == key)){
          ws.cell(y+4,x+6).string('✔').style(centerAlignStyle);
        } else {
          ws.cell(y+4,x+6).string('-').style(centerAlignStyle);
        }
      }
    }

    //Add filter to the first row
    ws.row(1).filter();

    //Automatically freeze columns
    //ws.column(6).freeze(); // Freezes the first five columns
    ws.row(3).freeze(); // Freezes the top four rows

    wb.write(filePath); 

    this.ux.log('File created at: '+filePath);
    // Organization always only returns one result
    //const orgName = sMenuItemRef[0].Name;
    //const trialExpirationDate = sMenuItemRef[0].Id;

    let outputString = `Hello `;
    //this.ux.log(sMenuItemRef[0]);

    // Return an object to be displayed with --json
    return { orgId: this.org.getOrgId(), outputString };
  }
}
