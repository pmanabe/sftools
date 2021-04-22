import { core, flags, SfdxCommand } from "@salesforce/command";

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);
import excelUtil = require("../../../scripts/createFile");

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages("sftools", "org");

export default class fileoutput extends SfdxCommand {
  private fs = require("fs");
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `Example : sfdx sftools:dependency:object -u sandboxorg -o "Account" `,
  ];

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  protected static flagsConfig = {
    msg: flags.string({
      char: "m",
      description: messages.getMessage("msgFlagDescription"),
    }),
    force: flags.boolean({
      char: "f",
      description: messages.getMessage("forceFlagDescription"),
    }),
    path: flags.string({
      char: "p",
      description: messages.getMessage("pathFlagDescription"),
    }),
    objects: flags.string({
      char: "o",
      required: true,
      description: messages.getMessage("objectFlagDescription"),
    }),
  };

  //Must implement method - run as per contact from SfdxCommand interface
  public async run(): Promise<core.AnyJson> {
    this.ux.log(this.flags.objects);

    const objects = this.flags.objects;
    const filePath =
      this.flags.path || "/Users/pmanabe/Downloads/ObjectInfo.csv";

    const conn = this.org.getConnection();

    interface sObject {
      activateable: boolean;
      createable: boolean;
      custom: boolean;
      customSetting: boolean;
      deletable: boolean;
      deprecatedAndHidden: boolean;
      feedEnabled: boolean;
      hasSubtypes: boolean;
      isSubtype: boolean;
      keyPrefix: string;
      label: string;
      labelPlural: string;
      layoutable: boolean;
      mergeable: boolean;
      mruEnabled: boolean;
      name: string;
      queryable: boolean;
      replicateable: boolean;
      retrieveable: boolean;
      searchable: boolean;
      triggerable: boolean;
      undeletable: boolean;
    }

    interface fieldInfo {
      label: string;
      name: string;
      custom: boolean;
      inlineHelpText: string;
      calculatedFormula: string;
      length: number;
      type: string;
      unique: string;
      precision: number;
      scale: number;
      encrypted: boolean;
      externalId: boolean;
      picklistValues: Array<pickList>;
      updateable: boolean;
      nillable: boolean;
      createable: boolean;
    }
    interface pickList {
      label: string;
      value: string;
    }
    interface objectDesc {
      name: string;
      fields: Array<fieldInfo>;
    }

    interface sobjectRes {
      encoding: string;
      maxBatchSize: number;
      sobjects: Array<sObject>;
    }

    interface customFieldDesc {
      id: number;
      records: Array<customField>;
    }

    interface customField {
      Id: string;
      DeveloperName: string;
      TableEnumOrId: string;
    }

    interface dependencyDesc {
      id: number;
      records: Array<dependencyField>;
    }

    interface dependencyField {
      MetadataComponentId: string;
      MetadataComponentName: string;
      MetadataComponentNamespace: string;
      MetadataComponentType: string;
      RefMetadataComponentId: string;
      RefMetadataComponentName: string;
      RefMetadataComponentNamespace: string;
      RefMetadataComponentType: string;
    }

    //this.ux.log(this.flags.objects);

    var objNames = new Array<String>();
    var combinedMetadata = new Array<customFieldDesc>();
    var dependencyMetadata = new Array<customFieldDesc>();

    if (objects) {
      var objectContext = objects.split(",");
      objectContext.forEach((element) => {
        objNames.push(element);
      });
    } else {
      const objNameResult = await conn.request("/services/data/v43.0/sobjects");
      var sObjectRef = objNameResult as sobjectRes;
      for (var i = 0; i < sObjectRef.sobjects.length; i++) {
        objNames.push(sObjectRef.sobjects[i].name);
      }
    }

    for (var i = 0; i < objNames.length; i++) {
      this.ux.log("Getting Field Metadata From : " + objNames[i]);
      let fldResult = await conn.request(
        "/services/data/v51.0/tooling/query?q=select+Id,+DeveloperName,TableEnumOrId+from+CustomField+where+TableEnumOrId+='" +
          objNames[i] +
          "'"
      );
      var objRes = fldResult as customFieldDesc;
      combinedMetadata.push(objRes);
    }

    for (var y = 0; y < combinedMetadata.length; y++) {
      for (var i = 0; i < combinedMetadata[y].records.length; i++) {
        // for (var i = 0; i < 1; i++) {
        this.ux.log(
          "Retriving Dependency: " +
            i +
            " of " +
            combinedMetadata[y].records.length
        );
        let fldResult = await conn.request(
          "/services/data/v51.0/tooling/query?q=select+MetadataComponentId,+MetadataComponentName,+MetadataComponentNamespace,+MetadataComponentType," +
            "+RefMetadataComponentId,+RefMetadataComponentName,+RefMetadataComponentNamespace,+RefMetadataComponentType+from+MetadataComponentDependency+where+RefMetadataComponentId='" +
            combinedMetadata[y].records[i].Id +
            //"00N3n000004bs0SEAQ" +
            "'"
        );
        var objRes = fldResult as dependencyDesc;
        dependencyMetadata.push(objRes);
      }
    }
    //this.ux.log(dependencyMetadata);

    var csv =
      "MetadataComponentId;MetadataComponentName;MetadataComponentNamespace;MetadataComponentType;RefMetadataComponentId;RefMetadataComponentName;RefMetadataComponentNamespace;RefMetadataComponentType;\n";
    dependencyMetadata.forEach((dep) => {
      for (var i = 0; i < dep.records.length; i++) {
        this.ux.log("Retriving Dependency: " + i + " of " + dep.records.length);
        csv +=
          dep.records[i].MetadataComponentId +
          ";" +
          dep.records[i].MetadataComponentName +
          ";" +
          dep.records[i].MetadataComponentNamespace +
          ";" +
          dep.records[i].MetadataComponentType +
          ";" +
          dep.records[i].RefMetadataComponentId +
          ";" +
          dep.records[i].RefMetadataComponentName +
          ";" +
          dep.records[i].RefMetadataComponentNamespace +
          ";" +
          dep.records[i].RefMetadataComponentType +
          ";" +
          "\n";
      }
    });

    this.fs.writeFile(filePath, csv, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log("File created!");
    });

    /*for (var i = 0; i < objNames.length; i++) {
      this.ux.log("Getting Field Metadata From : " + objNames[i]);
      let fldResult = await conn.request(
        "/services/data/v43.0/sobjects/" + objNames[i] + "/describe"
      );
      var objRes = fldResult as objectDesc;
      combinedMetadata.push(objRes);
    }
    this.ux.log(combinedMetadata);*/

    //await excelUtil.createFile(filePath,combinedMetadata);
    //this.ux.log('Excel File created at - '+filePath);

    return { orgId: this.org.getOrgId(), Dreamforce: "Best time of Year" };
  }
}
