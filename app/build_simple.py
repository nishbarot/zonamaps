# Builds simple.html: simple.tpl.html with the MapLibre stylesheet inlined.
t=open('simple.tpl.html').read()
assert '/*MAPLIBRE_CSS*/' in t
css=open('vendor/maplibre-gl.css').read()
open('simple.html','w').write(t.replace('/*MAPLIBRE_CSS*/',css))
print(len(t))
