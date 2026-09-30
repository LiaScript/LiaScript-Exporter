<!--
author:   LiaScript Exporter Tests
email:    LiaScript@web.de
version:  1.0.0
language: en
narrator: US English Female

comment:  Network fixture (@network tests only): remote imports, scripts,
          images and embeds. Expect hosts to be slow or down; keep these
          assertions out of the PR tier.

script:   https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.js
link:     https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.css
import:   https://raw.githubusercontent.com/liaTemplates/ABCjs/main/README.md
-->

# Network Test Course

MKNetIntro Everything below needs the network.

## Remote Images

MKNetImages

![MKNetImageGithub](https://raw.githubusercontent.com/LiaScript/LiaScript/master/src/assets/logo.png)

![MKNetImageWikimedia](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/250px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg)

Unfetchable (CORS-blocked) — must degrade to a labelled link, not vanish:

![MKNetImageCors](https://www.w3schools.com/html/pic_trulli.jpg)

## Embeds

MKNetEmbeds

!?[MKNetYoutube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

??[MKNetEmbed](https://liascript.github.io)

[preview-lia](https://raw.githubusercontent.com/LiaScript/docs/master/README.md)

## ABC Notation

MKNetAbc

``` abc  @ABCJS.render
X: 1
T: MKNetAbcTune
M: 4/4
L: 1/8
K: C
CDEF GABc | c2 B2 A2 G2 |
```

## Chartist

MKNetChartist Regression: Chartist binds the reserved xmlns namespace on its
label spans, which was fatal in epub.

<script>
new Chartist.Line('#mk-chartist', {
  labels: [1, 2, 3, 4],
  series: [[100, 120, 180, 200]]
});
undefined
</script>
<div class="ct-chart ct-golden-section" id="mk-chartist"></div>
