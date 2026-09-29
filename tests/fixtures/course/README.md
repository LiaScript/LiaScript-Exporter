<!--
author:   LiaScript Exporter Tests
email:    LiaScript@web.de
version:  1.0.0
language: en
narrator: US English Female
logo:     img/marker.png

comment:  Fixture course for the exporter test suite. Every element carries
          a unique marker (MK...) so a checker can ask "did element X reach
          format Y". Fully local: no imports, no remote media.

formula:  \sq  {#1^2}

@greet: <span class="greet">Hello @0, MKMacroExpanded</span>
-->

# Exporter Test Course

MKCourseIntro This course is the fixture for the LiaScript Exporter test suite.
Markers follow the pattern MK + CamelCase so they survive every format as one
unbreakable ASCII word.

<!-- MKCommentLeak: this HTML comment must never reach rendered output -->

--{{0}}--
MKNarratorComment This narrator comment is spoken in presentation mode.

## Text Formatting

MKTextFormatting *italic* **bold** ~~underline~~ ~~~strike~~~ ^super^
`inline code` and ***bold italic***.

Typography: en -- dash, em --- dash, ellipsis ... and arrows -> <-> =>.

Non-breaking&nbsp;space MKNbsp (regression: epub RSC-016 `&nbsp;`).

Unicode and emoji: MKUnicode Ω ∑ ∞ — 😀 🚀 ✓

Macro call: @greet(World)

Local Heading Without TOC Entry
===============================

MKLocalHeading This sits under an underline heading.

## Lists and Tasks

MKLists

1. First ordered
2. Second ordered
   - nested bullet MKNestedBullet
   - another bullet

- [X] MKTaskDone completed task
- [ ] MKTaskOpen open task

## Tables

MKTableIntro

| Name          | Value | Note            |
|:--------------|------:|:---------------:|
| MKTableCellA  |     1 | left aligned    |
| MKTableCellB  |     2 | centered note   |

## Blockquotes

MKQuoteIntro Regression: docx crashed on anything inside a quote (converter
arity bug), so the quote holds code, an image, a formula, a table and a list.

> MKQuoteText A quoted paragraph.
>
> ```js
> const MKQuoteCode = 42
> ```
>
> ![MKQuoteImage alt](img/photo.jpg)
>
> $$ \frac{MK}{Quote} = x_{formula} $$
>
> | MKQuoteTable | x |
> |--------------|---|
> | a            | 1 |
>
> - MKQuoteList item

> > MKNestedQuote A quote inside a quote.

## Images and Media

MKMediaIntro

![MKImagePng alt text](img/marker.png "MKImagePngTitle")

![MKImageJpg alt text](img/photo.jpg)<!-- style="width: 50%" -->

![MKImageSvg alt text](img/diagram.svg)

Gallery:

![MKGalleryA](img/marker.png)
![MKGalleryB](img/photo.jpg)

?[MKAudio local tone](media/tone.wav)

!?[MKVideo local clip](media/clip.webm)

[qr-code](https://liascript.github.io "MKQrCode")

## Code Blocks

MKCodeIntro

```python
def mk_python():
    return "MKCodePython"
```

Runnable JavaScript:

```javascript
const value = 6 * 7
console.log("MKCodeRunLog", value)
value
```
<script>@input</script>

Code project with a hidden file:

```javascript  -helper.js
function mkHelper() { return "MKCodeHiddenFile" }
```
```javascript  main.js
console.log(mkHelper(), "MKCodeProject")
```
<script>@input(0)
@input(1)</script>

## Markdown Inside Code

MKCodeMarkdownIntro Regression: `prepare()` inlined images referenced from
code, turning a 30-byte example into a 20 KB base64 blob.

```markdown
![MKCodeFenceImage](img/marker.png)
```

Inline span: `![MKCodeSpanImage](img/marker.png)` stays literal.

````markdown
A four-backtick fence showing a three-backtick one:

```js
// MKNestedFence4
```

![MKNestedFenceImage](img/photo.jpg)
````

`````markdown
A five-backtick fence showing a four-backtick one:

````
MKNestedFence5
````
`````

The same image right after the fences must still render: ![MKAfterFenceImage](img/marker.png)

## Formulas

MKFormulaIntro Inline $E = mc^2$ and a global macro $\sq{y}$.

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2} \qquad \alpha\beta\gamma
$$

Chemistry: $\ce{CO2 + C -> 2 CO}$

## Footnotes

MKFootnoteRef Something important[^1] and an inline one[^inline](MKFootnoteInline).

[^1]: MKFootnoteText The footnote body.

## Charts

MKChartIntro

<!-- data-type="BarChart" data-title="MKChartBar" data-show -->
| Language | Users |
|----------|------:|
| Python   |   100 |
| JS       |    80 |
| Rust     |    40 |

<!-- data-type="LinePlot" data-title="MKChartLine" data-xlabel="Year" data-ylabel="Value" data-show -->
| Year | Value |
|-----:|------:|
| 2020 |    12 |
| 2021 |    18 |
| 2022 |    27 |

## ASCII Art

MKAsciiIntro

```ascii  MKAsciiCaption
+--------+     +--------+
| Client |---->| Server |
+--------+     +--------+
     |   "$x^2$"    |
     v              v
+--------+     +--------+
| Cache  |     |   DB   |
+--------+     +--------+
```

## Inline SVG

MKSvgIntro Regression: epub needs `xmlns:xlink` on exactly the SVG that uses
it, and not on its sibling.

<svg id="mk-svg-xlink" width="200" height="80" viewBox="0 0 200 80">
  <path id="mk-sine" d="M10 40 Q 55 0 100 40 T 190 40" fill="none" stroke="#36c"/>
  <circle r="6" fill="#c33">
    <animateMotion dur="3s" repeatCount="indefinite">
      <mpath xlink:href="#mk-sine"/>
    </animateMotion>
  </circle>
</svg>

<svg id="mk-svg-plain" width="200" height="80" viewBox="0 0 200 80">
  <rect x="10" y="10" width="180" height="60" fill="#eee" stroke="#333"/>
  <text x="30" y="45">MKSvgText</text>
</svg>

## Quizzes

MKQuizIntro

MKQuizText What is the capital of France?

[[Paris]]
[[?]] MKQuizHint It is the city of the Eiffel tower.
***
MKQuizExplanation Paris has been the capital since the 10th century.
***

MKQuizSingle What is 2 + 2?

[( )] 3
[(X)] 4
[( )] 5

MKQuizMultiple Which are programming languages?

[[X]] Python
[[X]] JavaScript
[[ ]] HTML

MKQuizSelection The sky is [[ (blue) | red | green ]].

MKQuizGap The capital of Germany is [[Berlin]] and of Italy [[Rome]].

MKQuizMatrix

[[Berlin] [Paris] [Rome]]
[  (X)      ( )    ( )  ] Germany
[  ( )      (X)    ( )  ] France
[  ( )      ( )    (X)  ] Italy

MKQuizGeneric Script-driven quiz:

[[!]]
<script>
  true
</script>

## Surveys

MKSurveySingle How satisfied are you?

- [(good)] It is good
- [(bad)]  It is bad

MKSurveyMultiple Which topics interest you?

- [[ai]]  Artificial intelligence
- [[web]] Web development

MKSurveyText Your reaction?

[[___]]

MKSurveyTextarea Describe your opinion:

[[___ ___ ___]]

## Animations

MKAnimationIntro

     {{1}}
MKAnimationStep1 appears on step one.

      {{2}}
************************************

MKAnimationGroup appears on step two, together with this list:

- grouped item

************************************

Inline effect: {3}{MKAnimationInline}

--{{1}}--
MKNarratorStep1 Spoken at step one.

## Scripts and Dialogs

MKScriptIntro Regression: a blocking `alert()` froze the browser export until a
human clicked it. The dialog below fires during render.

<script>alert("MKAlertDialog")</script>

Reactive result: <script>"MKScriptResult" + (6 * 7)</script>

<section>

### Section Heading On Same Slide

MKSemanticSection Content inside a `<section>`.

</section>

<article>

### Article Heading On Same Slide

MKSemanticArticle Content inside an `<article>`.

</article>

## HTML

MKHtmlIntro

<lia-keep>
  <table class="mk-keep">
    <tr><td>MKLiaKeepCell</td><td rowspan="2">spanned</td></tr>
    <tr><td>second row</td></tr>
  </table>
</lia-keep>

<details>
<summary>MKDetailsSummary</summary>

MKDetailsBody hidden until expanded.

</details>

# Final Chapter

MKCourseEnd Last slide of the course.
