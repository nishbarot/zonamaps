import json
x0,y0,x1,y1=-77.872,40.776,-77.834,40.798
out=[]
with open('../data/bld/Pennsylvania.geojson') as fh:
    for line in fh:
        line=line.strip().rstrip(',')
        if not line.startswith('{"type":"Feature"'): continue
        # quick bbox pre-filter on first coordinate
        i=line.find('[[[')
        if i<0: continue
        j=line.find(',',i); k=line.find(']',j)
        try:
            lon=float(line[i+3:j]); lat=float(line[j+1:k])
        except: continue
        if x0<=lon<=x1 and y0<=lat<=y1:
            out.append(json.loads(line))
json.dump({"type":"FeatureCollection","features":out},open('../data/footprints_raw.geojson','w'))
print('footprints',len(out))
