import { Elm } from '../LiaScript/src/elm/Worker.elm'

global.XMLHttpRequest = require('xhr2');

var scopackager = require('simple-scorm-packager'),
    path = require('path'),
    temp = require('temp'),
    fs   = require('fs-extra'),
    argv = require('minimist')(process.argv.slice(2));


//console.warn(argv);

function help() {
  console.log("LiaScript-Exporter")
  console.log("")
  console.log("-h", "--help", "           show this help")
  console.log("-i", "--input", "          file to be used as input")
  console.log("-p", "--path", "           path to be packed, if not set, the path of the input file is used")
  console.log("-o", "--output", "         output file name (default is output), the ending is define by the format")
  console.log("-f", "--format", "         scorm1.2, json, fullJson (default is json)")

  console.log("\n-k", "--key", "            responsive voice key ")

  console.log("\nSCORM 1.2 settings:")
  console.log("")
  console.log("--organization", "         set the organization title")
  console.log("--masteryScore", "         set the scorm masteryScore (a value between 0 -- 100), default is 0")
  console.log("--typicalDuration", "      set the scorm duration, default is PT0H5M0S")
}

function tmpDir () {
  return new Promise((resolve, reject) => {
    temp.mkdir("lia", function(err, tmpPath) {
      console.warn(err, tmpPath);
      if (err)
        reject(err)
      else
        resolve(tmpPath)
    })
  })
}


function writeFile(filename, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, content, function (err) {
      if (err)  reject(err)
      else resolve("ok")
    })
  })
}


async function scrom1_2(argv, json) {

  // input
  let readme = argv.i || argv.input
  let output = argv.o || argv.output || "output"
  let path_  = argv.p || argv.path

  if (!path_) {
    path_  = path.dirname(readme)
    readme = path.basename(readme)
  }

  // make temp folder
  let tmp = await tmpDir()

  let tmpPath = path.join(tmp, "pro")

  // copy assets to temp
  await fs.copy(path.join(__dirname, './assets/scorm1.2'), tmpPath)


  await writeFile(path.join(tmpPath, 'config.js'), "window.config_ = " + JSON.stringify(json) + ";" )



  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // change responsive key
  let key = argv.k || argv.key
  if (key) {
    index = index.replace(
      "https://code.responsivevoice.org/responsivevoice.js",
      "https://code.responsivevoice.org/responsivevoice.js?key="+key
    )
  }

  index = index.replace(
    "</head>",
    "<script src=\"config.js\"></script></head>"
  )

  try {
    await writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e);
    return
  }


  // copy base path or readme-directory into temp
  await fs.copy(path_, tmpPath)


  let config = {
    version: '1.2',
    organization: argv.organization || 'LiaScript',
    title: json.lia.str_title,
    language: json.lia.definition.language,
    masteryScore: argv.masteryScore || 0,
    startingPage: 'index.html',
    startingParameters: "./"+readme,
    source: path.join(tmp, 'pro'),
    package: {
      version: json.lia.definition.version,
      zip: true,
      name: path.basename(output),
      author: json.lia.definition.author,
      outputFolder: path.dirname(output),
      description: json.lia.comment,
      //keywords: ['scorm', 'test', 'course'],
      typicalDuration: argv.typicalDuration || 'PT0H5M0S',
      //rights: `©${new Date().getFullYear()} My Amazing Company. All right reserved.`,
      vcard: {
        author: json.lia.definition.author,
        org: argv.organization || 'LiaScript',
        //tel: '(000) 000-0000',
        //address: 'my address',
        mail: json.lia.definition.email
        //url: 'https://mydomain.com'
      }
    }
  };

  scopackager(config, function(msg){
    console.log(msg);
    process.exit(0);
  });

}

if (argv.h || argv.help) {
  help()
} else if (argv.i || argv.input) {

  var app = Elm.Worker.init({flags: { cmd: "" }})

  app.ports.output.subscribe(function (event) {
    let [ok, string] = event
    let output = argv.o || argv.output || "output"
    let format = argv.f || argv.format || "json"

    format = format.toLowerCase()


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
      case "fulljson": {
        fs.writeFile(output + ".json", string, function (err) {
          if (err)
            console.error(err)
        })
        break
      }
      case "scorm1.2": {
        scrom1_2(argv, JSON.parse(string))
        break
      }

      default: {
        console.warn("unknown output format", format);
      }
    }
  })

  try {
    const data = fs.readFileSync(argv.i || argv.input, 'utf8')

    let format = argv.f || argv.format || "json"

    if (format == "json") {
      app.ports.input.send(["json", data])
    } else {
      app.ports.input.send(["fullJson", data])
    }


  } catch (err) {
    console.error(err)
  }
} else {
  console.warn("No input defined")
  help()
}
