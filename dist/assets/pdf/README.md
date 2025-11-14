<!--
author:   André Dietrich

email:    LiaScript@web.de

version:  1.0.0

language: en

@onload
window.LIA.debug = true
@end

-->

# Demo-LiaScript


<div style="width:100%;height:0;padding-bottom:56%;position:relative;"><iframe src="https://giphy.com/embed/StoU2izFCH9OhkHcpi" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/stellifymedia-itv-quiz-wwtbam-StoU2izFCH9OhkHcpi">via GIPHY</a></p>

### A Textquiz


``` js
let x = 10;
let y = 32;
```
<script>
  @input
window.console.warn("x + y =", x + y);

</script>

What did the **fish** say when he hit a **concrete wall**?

    [[dam]]

What did the **fish** say when he hit a **concrete wall**?

    [[dam]]


### Multiple Choice

Just add as many points as you wish:

    [[X]] Only the **X** marks the correct point.
    [[ ]] Empty ones are wrong.
    [[X]] ...

### Single Choice

Just add as many points as you wish:

    [( )] ...
    [(X)] <-- Only the **X** is allowed.
    [( )] ...

### Gap-Text

                    {{|>}}
The film that I saw [[(that)|those|these|then]] night wasn’t very good.
It was all [[ about ]] a man [[ who ]] built a
time machine so he [[ could ]] travel back in time.
It took him ages and ages [[ to ]] build the machine.

---

``` ascii 
.----------.      .----------.
| ⭐       |      |  ⭐ ⭐   |
|      ⭐  |      | ⭐ ⭐ ⭐ |
'----------'      '----------'
```

[[ 2 ]] + [[ 5 ]] = [[ 7 ]]



## Code

You can make your code executable and define projects:

``` js     -EvalScript.js
let who = data.first_name + " " + data.last_name;

if(data.online) {
  who + " is online"; }
else {
  who + " is NOT online"; }
```
``` json    +Data.json
{
  "first_name" :  "Sammy",
  "last_name"  :  "Shark",
  "online"     :  true
}
```
<script>
  // insert the JSON dataset into the local variable data
  let data = @input(1);

  // eval the script that uses this dataset
  eval(`@input(0)`);
</script>

## More

Find out what you can even do more with quizzes:

https://liascript.github.io/course/?https://raw.githubusercontent.com/liaScript/docs/master/README.md