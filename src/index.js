import { Elm } from '../LiaScript/src/elm/Worker.elm'

var scopackager = require('simple-scorm-packager');
var path = require('path');

var fs = require('fs-extra');
var argv = require('minimist')(process.argv.slice(2));

console.warn(argv);

function help() {
  console.log("LiaScript-Exporter")
  console.log("")
  console.log("-h", "--help", "           show this help")
  console.log("-i", "--input", "          file to be used as input")
  console.log("-p", "--path", "           path to be packed, if not set, the path of the input file is used")
  console.log("-o", "--output", "         output file name (default is output), the ending is define by the format")
  console.log("-f", "--format", "         scorm1.2, json, web (default is json)")
  //console.log("-b", "--base", "           define a base-path, default is './' ")
  console.log("-k", "--key", "            responsive voice key ")
}


if (argv.h || argv.help) {
  help()
} else if (argv.i || argv.input) {

  var app = Elm.Worker.init({flags: { cmd: "" }})

  app.ports.output.subscribe(function (event) {
    let [ok, string] = event
    let format = argv.f || argv.format || "json"
    let output = argv.o || argv.output || "output"


    if (!ok) {
      console.warn(string);
      return
    }

    switch(format) {
      case "json": {
        fs.writeFile(output + ".json", string, function (err) {
          if (err)
            console.error(err)
        })
        break
      }
      case "scorm1.2": {
        let json = JSON.parse(string)

        let readme = argv.i || argv.input

        const config = {
          version: '1.2',
          organization: 'LiaScript',
          title: json.str_title,
          language: json.definition.language,
          //masteryScore: 80,
          startingPage: 'index.html',
          startingParameters: path.basename(readme),
          source: path.join(__dirname, '../build'),
          package: {
            version: json.definition.version,
            zip: true,
            name: output,
            author: json.definition.author,
            outputFolder: path.join(__dirname, 'scorm_packages'),
            description: json.comment,
            //keywords: ['scorm', 'test', 'course'],
            //typicalDuration: 'PT0H5M0S',
            //rights: `©${new Date().getFullYear()} My Amazing Company. All right reserved.`,
            vcard: {
              author: json.definition.author,
              //org: 'My Amazing Company',
              //tel: '(000) 000-0000',
              //address: 'my address',
              mail: json.definition.email
              //url: 'https://mydomain.com'
            }
          }
        };

        fs.copy(
            path.join(__dirname, '../assets/scorm1.2'),
            path.join(__dirname, '../build')
          )
          .then(() => {
            let key = argv.k || argv.key
            if (key){
              try {
                let index = fs.readFileSync(path.join(__dirname, '../build/index.html'), 'utf8')

                index = index.replace(
                  "https://code.responsivevoice.org/responsivevoice.js",
                  "https://code.responsivevoice.org/responsivevoice.js?key="+key
                )

                fs.writeFile(path.join(__dirname, '../build/index.html'), index, function (err) {
                  if (err) {
                    console.error(err)
                    return
                  }


                  fs.copy(
                    path.dirname(readme),
                    path.join(__dirname, '../build')
                  )
                  .then(() => {
                    scopackager(config, function(msg){
                      console.log(msg);
                      process.exit(0);
                    });
                  })
                })
              } catch (err) {
                console.error(err)
              }
            }
          })
          .catch(err => console.error(err))


        break;
      }
      default: {
        console.warn("unknown output format", format);
      }
    }
  })

  try {
    const data = fs.readFileSync(argv.i || argv.input, 'utf8')
    app.ports.input.send(["string2Json", data])
  } catch (err) {
    console.error(err)
  }
} else {
  console.warn("No input defined")
  help()
}
