import re
src=open('page.src.html').read().split('\n')
def L(a,b): return '\n'.join(src[a-1:b])
def sub(s,a,b):
    assert a in s, a
    return s.replace(a,b)
t=open('simple.tpl.html').read()
section=L(482,499).replace('font-size="8.5"','font-size="10"').replace('font-size="9"','font-size="10.5"')
const=L(345,347)+'\n'+L(348,363)
# example places come from town.js, so drop the console's copy
const=re.sub(r"var FEATURED=\[\n.*?\n\];\n","",const,flags=re.S)
assert 'FEATURED' not in const
# nothing is selected on the overview, so the selection filters must accept an empty id
layers=L(687,699).replace("'line-color':css('--accent')","'line-color':css('--sel')").replace("'fill-color':css('--accent')","'fill-color':css('--sel')").replace("filter:['==',['get','id'],state.sel]","filter:['==',['get','id'],state.sel||'']")
layers=sub(layers,"'circle-radius':['interpolate',['linear'],['zoom'],14,0.7,16,1.5,18,3.4]","'circle-radius':['interpolate',['linear'],['zoom'],14,1.6,16,2.9,18,5]")
paint=L(426,463).replace("'sel-line','line-color',css('--accent')","'sel-line','line-color',css('--sel')").replace("'sel-fill','fill-color',css('--accent')","'sel-fill','fill-color',css('--sel')")
paint=sub(paint,"function dotColor(){\n","function dotColor(){\n  if(state.hl)return css('--dot-dim');\n")
paint=sub(paint,"var f=['==',['get','id'],state.sel];","var f=['==',['get','id'],state.sel||''];")
paint=sub(paint,"var d3=state.view==='3d',","var d3=state.view!=='2d',")
paint=sub(paint,"map.setPaintProperty('bld','fill-extrusion-height',d3?4:0);\n}","map.setPaintProperty('bld','fill-extrusion-height',d3?4:0);\n  syncExtra();\n}")
search=L(644,668).replace("if(!list.length){r.hidden=true;","if(!list.length&&empty){r.innerHTML='<div class=\"none\" role=\"status\">No address or parcel number matches. Try fewer words.</div>';r.hidden=false;$('q').setAttribute('aria-expanded','false');return;}\n  if(!list.length){r.hidden=true;").replace('function showResults(list){','function showResults(list,empty){').replace('  showResults(out);','  showResults(out,true);')
rep={'/*JS_CONST*/':const,'/*JS_HELPERS*/':L(375,383),
'/*JS_DOTS*/':L(385,423),'/*JS_PAINT*/':paint,'/*JS_SECTION*/':section,'/*JS_ROWS*/':L(502,524),'/*JS_PHRASE*/':L(525,530),'/*JS_SEARCH*/':search,'/*JS_LAYERS*/':layers}
for k,v in rep.items(): t=sub(t,k,v)
open('simple.src.html','w').write(t)
css=open('vendor/maplibre-gl.css').read()
open('simple.html','w').write(t.replace('/*MAPLIBRE_CSS*/',css))
print(len(t))
