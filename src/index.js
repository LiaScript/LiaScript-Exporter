import { Elm } from '../LiaScript/src/elm/Worker.elm'

const fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));


function help() {
  console.log("LiaScript-Exporter")
  console.log("")
  console.log("-h", "--help", "           show this help")
  console.log("-i", "--input", "          file to be used as input")
  console.log("-o", "--output", "         output file name (default is output), the ending is define by the format")
  console.log("-f", "--format", "         scorm1.2, json, web (default is json)")
  console.log("-b", "--base", "           define a base-path, default is './' ")

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
