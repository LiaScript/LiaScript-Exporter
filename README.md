# LiaScript-Exporter

This shall be a generic LiaScript-Exporter that can export educational content
into different formats, so that LiaScript courses can also be utilized in
different Learning Management Systems (LMS) or Readers for static content (PDF,
ePub, ...). At the moment there is only support for SCORM1.2, as the most
wide-spread exchange format. See the last section
[LMS Support List](#LMS-Support-List)

> __But__, it is still the easiest way to share your courses via
> __`https://LiaScript.github.io/course/?YOUR_REPO`__. The LiaScript course
> website is a fully fledged "offline-first" Progressive Web App (PWA), which
> allows to store all of your courses and states directly within your browser. If
> you are comming from Android, you can also directly install the website as an
> app on your device. Actually, there is now need for a BackEnd-system anymore,
> but if you need to track the progress of you students, you can use this tool...

## Install

At the moment this is a simple command-line tool based on NodeJS, thus you will
have to install NodeJS first, which contains also `npm` the Node Package
Manager. You can directly download the installer for your system from:

<https://nodejs.org/en/download/>

Afterwards you can open your terminal and type in the following command, this
will install the LiaScript-Exporter as a global application on your system.

__Install from npm:__

``` bash
npm install -g --verbose @liascript/exporter
```

Depending on your configuration, you might need to run this command with root
privileges. In my case on Linux it is simply:

``` bash
sudo npm install -g --verbose @liascript/exporter
```

__Install from github:__ Similar to the code above...

``` bash
npm install -g --verbose https://github.com/liaScript/LiaScript-Exporter
```

Depending on your configuration, you might need to run this command with root
privileges. In my case on Linux it is simply:

``` bash
sudo npm install -g --verbose https://github.com/liaScript/LiaScript-Exporter
```

On Windows you might need to run the terminal with administrator-privileges.

## Basic usage

If you have installed the package, you can now use `liaex` or
`liascript-exporter`. If you type one of the following commands, you will get
the following output.

``` shell
$ liaex
No input defined
LiaScript-Exporter

-h --help            show this help
-i --input           file to be used as input
-p --path            path to be packed, if not set, the path of the input file is used
-o --output          output file name (default is output), the ending is define by the format
-f --format          scorm1.2, scorm2004, json, fullJson, web, ims, pdf (default is json)
-v --version         output the current version

-k --key             responsive voice key 

SCORM settings:

--scorm-organization       set the organization title
--scorm-masteryScore       set the scorm masteryScore (a value between 0 -- 100), default is 0
--scorm-typicalDuration    set the scorm duration, default is PT0H5M0S
--scorm-iframe             use an iframe, when a SCORM starting parameter is not working

IMS settings:

--ims-indexeddb            Use IndexedDB to store data persistently

WEB settings:

--web-iframe               Use an iframed version to hide the course URL.
--web-indexeddb            This will allow to store data within the browser using indexeddb, you can optionally pass a unique key (by default one is generated randomly).
--web-zip                  By default the result is not zipped, you can change this with this parameter.

Android settings:

--android-sdk              Specify sdk.dir which is required for building.
--android-appName          Name of the App (Main-title is used as default).
--android-appId            Required to identify your App reverse url such as io.github.liascript
--android-icon             Optional icon with 1024x1024 px
--android-splash           Optional splash image with 2732x2732 px
--android-splashDuration   Duration for splash-screen default 0 milliseconds
--android-preview          Open course in Android-Studio

PDF settings:

--pdf-stylesheet           Inject an local CSS for changing the appearance.
--pdf-theme                LiaScript themes: default, turquoise, blue, red, yellow
--pdf-timeout              Set an additional time horizon to wait until finished.

https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions

--pdf-preview              Open preview-browser (default false), print not possible
--pdf-scale                Scale of the webpage rendering. Defaults to 1. Scale amount must be between 0.1 and 2.
--pdf-displayHeaderFooter  Display header and footer. Defaults to false.
--pdf-headerTemplate       HTML template for the print header, inject classes date, title, url, pageNumber, totalPages
--pdf-footerTemplate       HTML template for the print footer. Should use the same format as the headerTemplate
--pdf-printBackground      Print background graphics. Defaults to false
--pdf-landscape            Paper orientation. Defaults to false.
--pdf-pageRanges           Paper ranges to print, e.g., "1-5, 8, 11-13"
--pdf-format               Paper format. If set, takes priority over width or height options. Defaults to a4.
--pdf-width                Paper width, accepts values labeled with units.
--pdf-height               Paper height, accepts values labeled with units.
--pdf-margin-top           Top margin, accepts values labeled with units.
--pdf-margin-right         Right margin, accepts values labeled with units.
--pdf-margin-bottom        Bottom margin, accepts values labeled with units.
--pdf-margin-left          Left margin, accepts values labeled with units. 
--pdf-preferCSSPageSize    Give any CSS @page size declared in the page priority over what is declared in width and height or format options.
--pdf-omitBackground       Hides default white background and allows capturing screenshots with transparency. Defaults to true.

Project settings:

--project-no-meta          Disable the generation of meta information for OpenGraph and Twitter-cards.
--project-no-categories    Disable the filter for categories/tags.
--project-category-blur    Enable this and the categories will be blurred instead of deleted.
--project-generate-pdf     PDFs are automatically generated and added to every card.
--project-generate-cache   Only generate new files, if they do not exist.
```

### SCORM1.2

If you want to generate a SCORM1.2 conformant package of you LiaScript-course,
use the following command:

``` shell
$ liaex -i project/README.md --format scorm1.2 --output rockOn

..
project/README.md
project/Lizenz.md
..
[17:8:33] SCORM 'Init'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/imsmanifest.xml'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/metadata.xml'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/adlcp_rootv1p2.xsd'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/ims_xml.xsd'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/imscp_rootv1p1p2.xsd'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/imsmd_rootv1p2p1.xsd'
[17:8:33] SCORM 'Archiving /tmp/lia202037-30349-o6yx80.zb0eo/pro to rockOn.zip'
[17:8:34] SCORM 'rockOn.zip 4977779 total bytes'
Done

$ ls
.. rockOn.zip ..
```

The format is `scorm1.2` and the input folder is `project/README.md`. All the
content and sub-folders of this folder is then coppied into your SCORM.zip. The
name is defined by your output definition and contains the current version
number of you course as well as the current date.

> Note: SCORM 1.2 is too restrictive for storing data, that is why we currently
> only support to store location information, all states of quizzes, surveys, etc.
> will be lost after reload.
>
> Better use __SCORM2004__ as output

__Text 2 Speech `--key`__

If you want to use text2speech, you will have to register your website (where
the scorm package will be served) at <https://responsivevoice.org/> ... it is free
for educational and non commercial purposes. After your registration, you will
get a key in the format of `KluQksUs`. To inject this key into your package,
simly add the key as a paramter:

``` shell
$ liaex -i project/README.md --format scorm1.2 --key KluQksUs --output rockOn
...
```

__Mastery Score `--scorm-masteryScore`__

You can define the percentage of quizzes and surveys a student had to fullfill
in order to accomplish or pass the course by adding the `--scorm-masteryScore`
parameter. Just set it to 0 to allow all to pass the course, otherwise choose a
value between 0 and 100. All quizzes and surveys are treated equally, thus if
your course contains 10 quizzes, every quiz counts as 10%. If you do not set
this paramter, a default value of 80 percent is used.

``` shell
$ liaex -i project/README.md --format scorm1.2 --scorm-masteryScore 0 --output rockOn
...
```

__Other Root `--path`__

If your README is not in the root of your project, you can also use the `--path`
parameter to the directory to be copied into your scorm project. You will still
have to use `--input` to define the main course document, but his has to be
relative to path parameter.

__`--scrom-organization`__

This parameter simply sets the organization parameter in your SCORM
`imsmanifest` file. All other parameters are taken from the course

__`--scorm-iframe`__

Some LMS like ILIAS or OpenOlat seem to have problems with the required
`startingParameter` and will not load SCORM1.2 courses properly. To fix this,
this parameter can be used. It tries to run the course within an additional
`<iframe>`.

### SCORM2004

This output format provides the same settings as `scorm1.2`, but it allows to
store state information within the backend LMS. Currently supported are the
states for:

* quizzes
* surveys
* tasks

coding elements currently exceed the max storage capacity, that is why these
are not stored at the moment.

``` shell
$ liaex -i project/README.md --format scorm2004 --output rockOn
..
project/README.md
project/Lizenz.md
..
[12:38:31] SCORM 'Init'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsmanifest.xml'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/metadata.xml'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/XMLSchema.dtd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/adlcp_v1p3.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/adlnav_v1p3.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/adlseq_v1p3.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/datatypes.dtd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imscp_v1p1.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0auxresource.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0control.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0delivery.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0limit.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0objective.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0random.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0rollup.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0seqrule.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/imsss_v1p0util.xsd'
[12:38:31] SCORM 'create /tmp/lia2022114-556265-d2jh0k.odg7e/pro/xml.xsd'
[12:38:31] SCORM 'Archiving /tmp/lia2022114-556265-d2jh0k.odg7e/pro to rockOn.zip'
[12:38:32] SCORM 'rockOn.zip 19588706 total bytes'
Done

$ ls
.. rockOn.zip ..
```

### IMS Content

IMS Content is a very simplistic packaging format. Which allows you to embed
your course different LMS. The standard for the packaging format is defined
[here](https://www.imsglobal.org/content/packaging/index.html).

We currently support the latest v1.1.4 standard.

``` shell
$ liaex -i project/README.md --format ims --output course
..
project/README.md
project/Lizenz.md
..
6041733 total bytes
archiver has been finalized and the output file descriptor has closed.

$ ls
.. course.zip ..
```

__`--ims-indexeddb`:__ By default no states are preserved, which means, if you
reload the course, all quiz and coding states are destroyed. By using this
option a course is generated, which stores the content within the browsers local
`indexeddb`.

``` shell
$ liaex -i project/README.md --format ims --output course --ims-indexeddb
..
project/README.md
project/Lizenz.md
..Project settings:

--project-no-meta          Disable the generation of meta information for OpenGraph and Twitter-cards.
--project-no-categories    Disable the filter for categories/tags.
--project-category-blur    Enable this and the categories will be blurred instead of deleted.
--project-generate-pdf     PDFs are automatically generated and added to every card.
6041733 total bytes
archiver has been finalized and the output file descriptor has closed.

$ ls
.. course.zip ..
```

### WEB

This format will generate an autonomous & standalone web-project that can be uploaded
to any webserver.

```
$ liaex --format web -i project/README.md -o outputFolder
updating title ...
updating description ...
updating logo ...
```

All required sources as well as your project are copied into the `outputFolder` and
your course-file will be used as the default course. If you have defined the macros
`comment` and `logo` within your course, these information will also be injected into
the index.html. Such that, if you share your project via facebook or twitter, this
information is used to generate preview cards properly.

If you want your site to speak the text out loud, then you will have to add your
responsivevoice-key via `--key`.

__`--web-zip`:__ Use this parameter to directly bundle all input into a zip
file instead of a folder.

__`--web-iframe`:__ This will put the course into an secondary iframe, which will
hide the course-URL (the Markdown-file). Unfortunately, it will not be possible
anymore to link from outside to a specific slide.

__`web-indexeddb`:__ Generate a LiaScript package that will store states persistently.
By default, the database is generated uniquely for the packed course. That means,
every update will use a new database, which makes sense, if and only if, typos get
corrected or content is added to the end of the document. Mixing content and moving
quizzes and surveys to different slides might cause some problems in restoring the
state. But you can use this parameter with a key:

```shell
liaex --format web -i project/README.md -o outputFolder --web-indexeddb someKeyToUse
updating title ...
updating description ...
updating logo ...
```

### Android

To generate an APK project of your course, you will have to download the
[Android SDK](https://developer.android.com/studio) at first and provide the path
via the option `--android-sdk`. Additionally you will have to define an `appId`
via `--android-appId`, which is in most cases an unique URL (in reverse order)
that is pointing to your website/project. This export uses
[capacitorjs](https://capacitorjs.com) to pack the entire LiaScript runtime
environment and your resources into one installable Android apk.

``` shell
$ liaex -f android \
  -i ../LiaBooks/Arbeitsbuch-Prolog/README.md \
  --android-sdk /home/andre/Android/Sdk \
  --android-appId io.github.liascript.arbeitsbuch-prolog
...
../LiaBooks/Arbeitsbuch-Prolog
../LiaBooks/Arbeitsbuch-Prolog/img
../LiaBooks/Arbeitsbuch-Prolog/img/turtle.png
...
added 401 packages, and audited 402 packages in 34s

23 packages are looking for funding
  run `npm fund` for details

5 moderate severity vulnerabilities

...
✔ Adding native android project in android in 37.13ms
✔ add in 38.39ms
✔ Copying web assets from dist to android/app/src/main/assets/public in 97.33ms
✔ Creating capacitor.config.json in android/app/src/main/assets in 207.60μs
✔ copy android in 100.41ms
✔ Updating Android plugins in 592.70μs
[info] Found 1 Capacitor plugin for android:
       @capacitor-community/text-to-speech@1.1.2
✔ update android in 18.04ms
✔ Syncing Gradle in 143.57μs
[success] android platform added!
Follow the Developer Workflow guide to get building:
https://capacitorjs.com/docs/basics/workflow
📦  Capacitor Resources v2.0.5
-----------------------------

Checking files and directories...
 ✓  Processing files for: android
 ✓  Icon file ok (1024x1024)
 ✓  Splash file ok (2732x2732)
 ✓  Output directory ok (resources)

Generating files...
 ✓  Generated icon files for android
 ✓  Generated splash files for android
 ✓  Successfully generated all files
Root path: /tmp/lia202227-209284-1q2g2zd.tn3x

----------------------------------------------

📦  Capacitor resources generated successfully!
...
Currently detected usages in: root project 'android', project ':app', project ':capacitor-android', ...
> Task :app:preBuild UP-TO-DATE
> Task :app:preDebugBuild UP-TO-DATE
> Task :capacitor-android:preBuild UP-TO-DATE
> Task :capacitor-android:preDebugBuild UP-TO-DATE
> Task :capacitor-android:compileDebugAidl NO-SOURCE

Deprecated Gradle features were used in this build, making it incompatible with Gradle 8.0.
Use '--warning-mode all' to show the individual deprecation warnings.
See https://docs.gradle.org/7.0/userguide/command_line_interface.html#sec:command_line_warnings

BUILD SUCCESSFUL in 3s
103 actionable tasks: 103 executed

DONE

$ ls 
... output.apk ...
```

> __Note:__ To achieve better performance and offline capabilities, try to add
> all resources as local ones to your project (i.e. images, audio,scripts, css).
>
> If you want to preview the result, simply use `--android-preview`, which will
> open android-studio

__Still a bit experimental__

### PDF

For printing out courses to PDF this package uses
[puppeteer](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions),
which is an entire browser. This blows up the project a bit, but it allows to
store also the results of iframes, and to run coding examples. What this export
does is basically load the entire course within a single page and run all
scripts included, code examples, etc. Videos, iframes, audio, etc. are preserved
as screenshots, which provide a link to the original resource.

This format has a `--pdf-preview` mode, which allows you to inspect your course,
which works also with https inputs.

``` shell
liaex --format pdf --pdf-preview -i https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_ProzeduraleProgrammierung/master/08_Objekte.md

```

There are a couple of tweaks, that you can use, have a look at the following
resource:

[Puppeteer pdf settings](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions)

__`--pdf-stylesheet`__

Next to these settings, you can also change the appearance of fonts, colors, etc.
with you custom CSS. This can define anything, and you can also overwrite all CSS
variables LiaScript is based on.

``` bash
$ cat custom.css \
:root {
    --color-highlight: 2, 255, 0;
    --color-background: 122, 122, 122;
    --color-border: 0, 0, 0;
    --color-highlight-dark: 0, 0, 0;
    --color-highlight-menu: 0, 0, 0;
    --color-text: 0, 0, 255;
    --global-font-size: 1rem;
    --font-size-multiplier: 2;
}% 
$
$ liaex --format pdf \
  -o example \
  --pdf-stylesheet custom.css \
  -i https://github.com/TUBAF-IfI-LiaScript/VL_ProzeduraleProgrammierung/blob/master/08_Objekte.md

depending on the size of the course, this can take a while, please be patient...
```

__`--pdf-theme`__

If you want to change only the appearance by defining the LiaScript theme,
which can be either: default, turquoise, blue, red, yellow.

``` bash
$ liaex --format pdf \
  -o example \
  --pdf-theme red \
  -i https://github.com/TUBAF-IfI-LiaScript/VL_ProzeduraleProgrammierung/blob/master/08_Objekte.md

depending on the size of the course, this can take a while, please be patient...
```

__`--pdf-timeout`__

You have to be aware, that the PDF generation can be quite time consuming
especially for large courses with a lot of scripts and code-snippets to be
executed and multimedia to be loaded. `puppeteer` thus sometimes does not know
when the course is ready. If the generation fails, you should try to increase
this value, the default is 30000, which means 30 seconds.

``` bash
$ liaex --format pdf \
  -o example \
  --pdf-timeout 50000 \
  -i https://github.com/TUBAF-IfI-LiaScript/VL_ProzeduraleProgrammierung/blob/master/08_Objekte.md

depending on the size of the course, this can take a while, please be patient...
```

### Project

Projects are a way to bundle a collection of courses and to make a custom overview page for it.

The input has to be a yaml file that looks like the following one:

```yml
title: >
  <span style="background-color: rgba(0,106,179,0.75); padding: 5px; color: white">
    My personal OER - collection
  </span>

comment: >
  This is used as a subtitle or as a description of your page

logo: https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Universitaetsbibliothek_Freiberg_Fassade.jpg/1024px-Universitaetsbibliothek_Freiberg_Fassade.jpg

icon: https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Logo_TU_Bergakademie_Freiberg.svg/242px-Logo_TU_Bergakademie_Freiberg.svg.png

footer: >
  Simply add a custom footer - that can also contain HTML
  <a href="https://liascript.github.io" target="_blank">Made with LiaScript</a>

# With this settings you can customize social metadata, og-graph for facebook or twitter
# if not present, the title, comment, and logo will be used.
# You can explicitly turn this of with the cmd-parameter --project-no-meta
meta:
  title: OER-Collection
  description: Sammlung der OER Inhalte der Arbeitsgruppe Softwareentwicklung und Robotik (TU Freiberg)
  #image: url

# A collection is where you put all your courses into, all information, such as title, comment, logo, etc.
# will be taken from the links that you provide ...
collection:

  - url: https://raw.githubusercontent.com/LiaScript/docs/master/README.md
  - url: https://raw.githubusercontent.com/LiaBooks/LiaScript-Tutorial/main/README.md
  - url: https://raw.githubusercontent.com/LiaPlayground/LiaScript_WeAreDevelopers2022/main/README.md

  # Additionally it is possible to manually overwrite parameters
  - url: https://raw.githubusercontent.com/LiaPlayground/LiaScript_Tutorial_Kigali/main/README.md
    title: eLearning Africa Workshop 2022
    comment: Shows only an introduction, please follow the links within the course.
    # logo: https://another_image.jpg
    # or leave, so that no card-image is added to your preview-cards
    # logo: 

    # You can manually tag courses, if this has not been done within the main comment of the course.
    # By default, these tags will be treated as categories, which can be used to navigate through
    # your courses. To disable this, use the cmd-param --project-no-categories
    # 
    # For smaller overviews, you can also use the --project-category-blur parameter.
    # this will not hide the courses, that do not match, but instead blur them.
    tags:
      - Tutorial
      - LiaScript
      - OER

  - html: >
      <hr>
      <h1>Some content in between</h1>
      
      <p>You can add additional content in between to group your course collections or provide more information.</p>

  # If you want to group multiple courses into one sub-collection, then instead of an "-url:"
  # define another `collection`. All parameters can be changed as above. Additionally you can switch of images or comments,
  # just by adding an empty attribute. And, it is also possible to add tags to every sub-course.
  - title: Prozedurale Programmierung
    comment: todo
    collection:
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_ProzeduraleProgrammierung/master/00_Einfuehrung.md
        #title: Rename the current course
        #logo: Manually set an logo
        #comment: Add a custom description, this will overwrite the comment within the course
        # tags will be used for navigation and searching
        #tags: 
        # - C++
        # - Programmierung
        # - Hardware
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_ProzeduraleProgrammierung/master/01_EingabeAusgabeDatentypen.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_ProzeduraleProgrammierung/master/02_OperatorenKontrollstrukturen.md
      #- url: ...

  # HTML content can be placed between cards
  - html: >
      <hr>
      <h1>Softwareentwicklung</h1>
      
      <p>todo</p>

  - title: Softwareentwicklung
    comment: Todo
    grid: true # if you have larger collections and you want them to appear in a grid and not in a row, with some
               # hidden content, then set the grid-parameter to true.
    collection:
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/00_Einfuehrung.md
        logo: # this is used to empty the default image icon
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/01_Software.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/02_DotNet.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/03_CsharpGrundlagenI.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/04_CsharpGrundlagenII.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/05_CsharpGrundlagenIII.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/06_ProgrammflussUndFunktionen.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/07_OOPGrundlagenI.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/08_OOPGrundlagenII.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/09_Vererbung.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/10_AbstrakteKlassenUndInterfaces.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/11_VersionsverwaltungI.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/12_VersionsverwaltungII.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/13_UML_Modellierung.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/14_UML_ModellierungII.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/15_UML_ModellierungIII.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/16_Testen.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/17_Dokumentation_BuildTools.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/18_ContinuousIntegration.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/19_Generics.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/20_Container.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/21_Delegaten.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/22_Events.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/23_Threads.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/24_Tasks.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/25_LINQ.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/26_DesignPattern.md
      - url: https://raw.githubusercontent.com/TUBAF-IfI-LiaScript/VL_Softwareentwicklung/master/27_Anwendungen.md
```

Basic usage:

``` shell
liaex -i curriculum.yml --format project
```

If you want to add precompiled pdf to every course, then you simply have to add the `--project-generate-pdf` command.
Additionally, you can pass any pdf settings to customize the pdf output.


``` shell
liaex -i curriculum.yml --format project --project-generate-pdf --pdf-format A4
```

## TODOs & Contributions

* Further exporter

  * AICC
  * xAPI
  * ePub

* Integration into the Atom IDE

* GitHub actions to automate building during push ...

### Custom extensions

If you are interested in creating integrations for other systems by your own,
you can do this, by defining custom connectors for your target system. They are
located at
[src/javascript/connectors](https://github.com/liaScript/LiaScript/tree/master/src/javascript/connectors).
Actually it is a simple class that inherits all methods from `Base/Connector`,
which have to be changed in accordance to you system.
__I will have to document this__

## LMS Support List

Most of the data is taken from:

* <https://www.ispringsolutions.com/supported-lms>
* <https://en.wikipedia.org/wiki/List_of_learning_management_systems>

| LMS                                | SCORM 1.2 | SCORM 2004 | xAPI    | AICC    | CMI-5 | IMS  | License     |
| ---------------------------------- | --------- | ---------- | ------- | ------- | ----- | ---- | ----------- |
| Abara LMS                          | full      | full       |         |         |       |      |             |
| Absorb LMS                         | full      | full       | full    | full    |       |      |             |
| Academy LMS                        | full      | full       |         |         |       |      |             |
| Academy Of Mine                    | full      | full       | full    |         |       |      |             |
| Accessplanit LMS                   | full      | full       |         |         |       |      |             |
| Accord LMS                         | full      | full       |         |         |       |      |             |
| Activate LMS                       |           | full       |         |         |       |      |             |
| Administrate LMS                   | full      | full       |         |         |       |      |             |
| Adobe Captivate Prime LMS          | full      |            |         |         |       |      |             |
| Agylia LMS                         | full      |            | full    |         |       |      |             |
| Alchemy LMS                        |           | full       |         |         |       |      |             |
| Alumn-e LMS                        | full      |            |         |         |       |      |             |
| aNewSpring LMS                     | full      |            |         |         |       |      |             |
| Asentia LMS                        | full      | full       | full    |         |       |      |             |
| aTutor                             | full      |            |         |         |       | full | open source |
| Axis LMS                           | partial   |            |         |         |       |      |             |
| BIStrainer LMS                     | full      | full       |         |         |       |      |             |
| BizLibrary LMS                     | full      |            |         |         |       |      |             |
| Blackboard LMS                     | full      | full       | partial | full    |       |      |             |
| BlueVolt LMS                       | full      | full       |         | full    |       |      |             |
| BrainCert LMS                      | full      | full       |         |         |       |      |             |
| Bridge LMS                         | full      | full       |         | full    |       |      |             |
| Brightspace LMS                    | full      | full       |         |         |       |      |             |
| Business Training TV (by Vocam)    | full      | full       | full    |         |       |      |             |
| Buzz LMS (by Agilix)               | full      | full       |         | partial |       |      |             |
| Canvas LMS                         | full      | full       |         |         |       |      | open source |
| CERTPOINT Systems Inc.             | full      | full       |         |         |       |      | proprietary |
| Chamilo LMS                        | full      |            |         |         |       | full | open source |
| Claroline                          | full      |            |         |         |       | full | open source |
| Claromentis LMS                    | full      |            |         |         |       |      |             |
| chocolateLMS                       | full      |            |         |         |       |      |             |
| Coggno LMS                         | full      | full       |         |         |       |      |             |
| Cognology LMS                      | full      |            |         |         |       |      |             |
| Collaborator LMS                   | full      | full       |         |         |       |      |             |
| ComplianceWire LMS                 | full      | full       |         |         |       |      |             |
| Cornerstone LMS                    | partial   | full       |         |         |       |      |             |
| CourseMill LMS                     | full      | full       |         |         |       |      |             |
| CoursePark LMS                     | full      | full       |         |         |       |      |             |
| Coursepath LMS                     | full      | full       | full    |         |       |      |             |
| Courseplay LMS                     | full      | full       |         |         |       |      |             |
| CourseSites LMS                    | full      | full       |         |         |       |      |             |
| CrossKnowledge Learning Suite      | full      | full       |         | full    |       |      |             |
| Curatr LMS                         | partial   | partial    | full    |         |       |      |             |
| DigitalChalk LMS                   | full      | no         | full    |         |       |      |             |
| Desire2Learn                       |           | full       |         |         | full  | full | proprietary |
| Docebo LMS                         | full      | full       |         | full    |       |      |             |
| EasyCampus LMS                     | full      |            |         |         |       |      |             |
| eCollege                           |           |            |         |         |       |      | proprietary |
| Edmodo                             |           |            |         |         |       |      | proprietary |
| EduBrite LMS                       | full      | full       |         | full    |       |      |             |
| EducationFolder LMS                |           |            | full    |         |       |      |             |
| EduNxt                             | full      | full       |         |         |       |      | proprietary |
| Eduson LMS                         | partial   |            |         |         |       |      |             |
| Edvance360 LMS                     | full      |            |         |         |       |      |             |
| Effectus LMS                       | full      | full       | full    |         |       |      |             |
| eFront LMS                         | full      |            |         |         |       |      | open source |
| eLeap LMS                          | full      |            |         |         |       |      |             |
| ELMO                               | full      |            |         |         |       |      |             |
| Elsevier Performance Manager LMS   | full      |            |         |         |       |      |             |
| Emtrain LMS                        | full      | full       |         | full    |       |      |             |
| Engrade                            |           |            |         |         |       |      | proprietary |
| eSSential LMS                      | full      |            | full    |         |       |      |             |
| eTraining TV (by Vocam)            | full      | full       | full    |         |       |      |             |
| Evolve LMS                         | full      |            |         |         |       |      |             |
| Exceed LMS                         | full      |            |         |         |       |      |             |
| ExpertusONE LMS                    | full      | full       |         |         |       |      |             |
| EZ LCMS                            | full      | full       |         |         |       |      |             |
| Firmwater LMS                      | full      | full       |         |         |       |      |             |
| Flora                              | full      | full       |         |         |       |      |             |
| Forma LMS                          | full      | full       |         |         |       |      |             |
| Geenio LMS                         | partial   | partial    |         |         |       |      |             |
| GlobalScholar                      |           |            |         |         |       |      | proprietary |
| Glow                               |           |            |         |         |       |      | proprietary |
| GnosisConnect LMS                  | full      | full       |         |         |       |      |             |
| Google Classroom                   | no        | no         | no      |         |       |      |             |
| GoSkills LMS                       | full      | full       | full    |         |       |      |             |
| GO1 LMS                            | full      | full       |         |         |       |      |             |
| GrassBlade LRS                     | full      | full       | full    |         |       |      |             |
| Grovo LMS                          | full      | full       | full    |         |       |      |             |
| GyrusAim LMS                       | full      | full       | full    | full    |       |      |             |
| HealthStream LMS                   | full      | full       |         |         |       |      |             |
| HotChalk                           |           |            |         |         |       |      | proprietary |
| ILIAS LMS                          | full      | full       |         |         |       | full |             |
| iLMS                               | full      | full       |         | full    |       |      | open source |
| IMC Learning Suite                 |           | full       |         |         |       |      |             |
| Informetica LMS                    | full      | full       |         |         |       |      |             |
| Inquisiq R4 LMS                    | full      | full       |         |         |       |      |             |
| Intuition Rubicon LMS              | full      |            |         |         |       |      |             |
| In2itive LMS                       | full      | full       |         |         |       |      |             |
| ISOtrain LMS                       | full      | full       |         | full    |       |      |             |
| iSpring Learn                      | full      | full       |         |         |       |      |             |
| itslearning                        |           |            |         |         |       | full |             |
| JLMS                               | full      | full       | full    | full    |       |      |             |
| JoomlaLMS                          | full      | full       |         |         |       |      |             |
| Kannu                              |           |            |         |         |       |      | proprietary |
| KMI LMS                            | full      |            | full    |         |       |      |             |
| LabVine LMS by LTS Health Learning | full      |            |         |         |       |      |             |
| LAMS                               | partial   |            |         |         |       | full | open source |
| LatitudeLearning LMS               | full      | full       |         |         |       |      |             |
| LearnConnect LMS                   | full      |            |         |         |       |      |             |
| LearnDash LMS                      | no        | no         | no      | full    |       |      |             |
| LearningCart LMS                   | full      | full       |         |         |       |      |             |
| learningCentral LMS                | full      | full       | full    | full    |       |      |             |
| LearningZen LMS                    | full      | full       | full    |         |       |      |             |
| Learning Locker LRS                |           |            | full    |         |       |      |             |
| learnPro LCMS                      | full      |            |         |         |       |      |             |
| LearnUpon LMS                      | full      |            | full    |         |       |      |             |
| LearnWorlds LMS                    | full      | full       |         |         |       |      |             |
| Learn-WiseGo LMS                   |           | full       |         |         |       |      |             |
| LifterLMS                          |           |            | full    |         |       |      |             |
| Litmos LMS                         | full      |            | full    |         |       |      |             |
| LMS365                             | full      | full       |         |         |       |      |             |
| LON-CAPA                           | partial   |            |         |         |       |      | open source |
| MATRIX LMS                         | full      |            |         |         |       |      |             |
| Meridian LMS                       | full      | full       |         |         |       |      |             |
| Mobile Agility LMS                 | full      | full       |         |         |       |      |             |
| Moodle LMS                         | full      | full       |         | partial |       | full |             |
| MOS Chorus LMS                     |           | full       |         |         |       |      |             |
| Myicourse LMS                      | partial   | partial    |         |         |       |      |             |
| MySkillpad LMS                     | full      | full       |         |         |       |      |             |
| NEO LMS                            | full      |            |         |         |       |      |             |
| NetDimensions Learning             | full      | full       |         | full    |       |      |             |
| Nimble LMS                         | full      |            |         |         |       |      |             |
| Ninth Brain LMS                    | full      | full       | full    |         |       |      |             |
| OLAT LMS                           | full      | full       |         |         |       | full |             |
| OPAL                               | full      | no         |         |         |       | full |             |
| Open edx                           | full      |            |         |         |       |      | open source |
| OpenOLAT                           | full      |            |         |         |       | full | open source |
| Opigno LMS                         | full      | full       |         |         |       |      |             |
| Oracle Taleo Learn Cloud Service   | full      | full       |         | full    |       |      |             |
| Paradiso LMS                       | full      | full       |         |         |       |      |             |
| Percepium LMS                      | full      | full       |         |         |       |      |             |
| Percolate LMS                      | full      | full       |         |         |       |      |             |
| Prosperity LMS                     | full      | full       |         |         |       |      |             |
| RISC's Virtual Training Assistant  | full      | full       | full    | full    | full  |      |             |
| Saba LMS                           | full      | full       |         | full    |       |      |             |
| Sakai LMS                          | full      | full       |         |         |       |      |             |
| SAP SuccessFactors LMS             | full      | full       |         | full    |       |      | proprietary |
| ScholarLMS                         | full      | full       | full    |         |       |      |             |
| Schoology LMS                      | full      | full       |         |         |       |      | proprietary |
| Schoox LMS                         | full      | full       |         |         |       |      |             |
| ShareKnowledge LMS                 | full      | full       |         |         |       |      |             |
| Shika LMS                          | full      | full       |         |         |       |      |             |
| SilkRoad LMS                       | full      | full       |         | full    |       |      |             |
| Simplify LMS                       | full      |            | full    |         |       |      |             |
| Skilljar LMS                       | full      |            |         |         |       |      |             |
| Skillsoft                          |           |            |         |         |       |      | proprietary |
| SkillsServe LMS                    | full      | full       |         |         |       |      |             |
| SmarterU LMS                       | full      | full       |         | full    |       |      |             |
| Spongelab                          |           |            |         |         |       |      | proprietary |
| SuccessFactors                     |           |            |         |         |       |      | proprietary |
| SumTotal LMS (by SkillSoft)        | full      | full       |         | full    |       |      | proprietary |
| SWAD                               |           |            |         |         |       |      | open source |
| SwiftLMS                           | full      | full       |         |         |       |      |             |
| Syberworks LMS                     |           |            |         |         |       |      |             |
| Syfadis Suite LMS                  | full      | full       |         |         |       |      |             |
| Thinking Cap LMS                   | full      | full       |         |         |       |      |             |
| TalentLMS                          | full      | no         | full    |         |       |      |             |
| Taleo                              | full      | full       |         | partial |       |      | proprietary |
| TCManager LMS                      | full      |            |         |         |       |      |             |
| Techniworks LMS                    | full      | full       |         |         |       |      |             |
| Thinkific LMS                      |           |            |         |         |       |      |             |
| TOPYX LMS                          | full      | full       |         |         |       |      |             |
| Torch LMS                          | full      | full       | full    | full    |       |      |             |
| Totara LMS                         | full      |            |         |         |       |      |             |
| Udutu LMS                          | full      | full       |         |         |       |      |             |
| UpGraduate LMS                     | full      | full       | full    | full    |       |      |             |
| UpsideLMS                          | full      | full       | partial |         |       |      |             |
| Uzity                              |           |            |         |         |       |      | proprietary |
| ViewCentral LMS                    | full      |            |         |         |       |      |             |
| viLMS                              | full      | full       |         |         |       |      |             |
| Vowel LMS                          | full      | full       |         |         |       |      |             |
| Watershed LRS                      |           |            | full    |         |       |      |             |
| Wax LRS                            |           |            | full    |         |       |      |             |
| WBTServer LMS                      |           | full       |         |         |       |      |             |
| WebCampus LMS                      | full      |            |         |         |       |      |             |
| WeBWorK                            |           |            |         |         |       |      | open source |
| WestNet MLP                        | partial   | partial    | partial |         |       |      |             |
| wizBank e-Learning Platform        | full      | full       |         |         |       |      |             |
| WizIQ LMS                          | partial   | partial    |         |         |       |      |             |
| Workday LMS                        | full      | full       |         |         |       |      |             |
| WorkWize LMS                       | full      |            |         |         |       |      |             |
| xapiapps LMS                       | full      | full       | full    |         |       |      |             |
| 360Learning LMS                    | full      | full       |         |         |       |      |             |
