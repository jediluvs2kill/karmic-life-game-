"""Original Karmic idea architecture. Run with Blender 4.5+ in background.

blender --background --python scripts/blender/build_assets.py -- --root .
The editable .blend library and public GLBs are outputs of this authored source.
Every object is a fantasy interpretation of the user's concept, not a prototype
or claim that its real-world engineering has been validated.
"""
import argparse, bpy, bmesh, json, math, os, re, sys, time
from mathutils import Vector
from math import pi, sin, cos

args = argparse.ArgumentParser()
args.add_argument('--root', default='.')
args.add_argument('--render', action='store_true')
args.add_argument('--only', nargs='*', help='Rebuild the source library but replace only these project GLBs.')
args.add_argument('--preview', action='store_true', help='Build and render in .karmic without replacing live assets.')
opt = args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
ROOT = os.path.abspath(opt.root)
OUT = os.path.join(ROOT, 'public', 'assets', 'projects')
SOURCE = os.path.join(ROOT, 'assets', 'blender')
STAGING = os.path.join(ROOT, '.karmic', 'blender-build')
if opt.preview:
    OUT=os.path.join(STAGING,'preview-assets');SOURCE=os.path.join(STAGING,'preview-source')
os.makedirs(OUT, exist_ok=True); os.makedirs(SOURCE, exist_ok=True);os.makedirs(STAGING, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

COLORS = {
 'ivory':'DED9C8', 'stone':'ADB3AA', 'dark':'2A3740', 'teal':'416F73',
 'blue':'599BAC', 'gold':'B18D56', 'orange':'B27C61', 'green':'647F69',
 'leaf':'94AA7A', 'pink':'B58C9E', 'glass':'759FA8', 'white':'F2F0E8',
 'ink':'3B5264', 'red':'A9655E', 'purple':'88859E', 'earth':'8D7864',
 'mortar':'C8C9BE', 'wood':'A38465', 'trim':'CCD5D0', 'soil':'665E51',
}
def linear(v):
    v=v/255; return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
materials={}
for name, hx in COLORS.items():
    m=bpy.data.materials.new(name);m.diffuse_color=tuple(linear(int(hx[i:i+2],16)) for i in (0,2,4))+(1,)
    m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=m.diffuse_color;n.inputs['Roughness'].default_value=.8
    materials[name]=m
vertex_material=bpy.data.materials.new('Karmic Blender palette')
vertex_material.use_nodes=True
nodes=vertex_material.node_tree.nodes;bsdf=nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value=.8;bsdf.inputs['Metallic'].default_value=0
vcol=nodes.new('ShaderNodeVertexColor');vcol.layer_name='Color'
vertex_material.node_tree.links.new(vcol.outputs['Color'],bsdf.inputs['Base Color'])
parts=[]
def finish(obj, color, name, bevel=0, smooth=False):
    obj.name=name;obj.data.materials.append(materials[color]);parts.append(obj)
    if bevel:
        mod=obj.modifiers.new('Machined edge radius','BEVEL');mod.width=bevel;mod.segments=3 if bevel>=.015 else 1
        mod.harden_normals=True
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
        for p in obj.data.polygons:p.use_smooth=True
        normals=obj.modifiers.new('Planar face normals','WEIGHTED_NORMAL');normals.keep_sharp=True;normals.weight=50
        bpy.ops.object.modifier_apply(modifier=normals.name)
    elif smooth:
        # Side walls and curved surfaces are smooth; broad end caps stay planar.
        for p in obj.data.polygons:p.use_smooth=len(p.vertices)<=4
    return obj
def box(x,y,z,w,h,d,c='ivory',name='Architectural volume',r=0,bevel=.045):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,z,y));o=bpy.context.object;o.dimensions=(w,d,h);o.rotation_euler.z=-r
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,c,name,min(bevel,min(w,h,d)*.15))
def panel(x,y,z,w,h,d,c='dark',name='Rounded panel',radius=.08):
    """A rounded rectangular extrusion; corner radius is independent of depth."""
    radius=min(radius,w*.24,h*.24);outline=[]
    for cx,cy,start in [(w/2-radius,h/2-radius,0),(-w/2+radius,h/2-radius,pi/2),(-w/2+radius,-h/2+radius,pi),(w/2-radius,-h/2+radius,pi*1.5)]:
        for i in range(5):
            a=start+i*pi/8;outline.append((x+cx+radius*cos(a),y+cy+radius*sin(a)))
    verts=[(xx,z+dz,yy) for dz in [-d/2,d/2] for xx,yy in outline];n=len(outline)
    faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]
    for i in range(n):faces.append((i,(i+1)%n,(i+1)%n+n,i+n))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    return finish(obj,c,name,smooth=True)
def cyl(x,y,z,r,h,c='teal',name='Drum',r2=None,vertices=24):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=h,location=(x,z,y))
    return finish(bpy.context.object,c,name,bevel=min(.018,h*.09,r*.07) if vertices>6 else 0,smooth=vertices>6)
def orb(x,y,z,r,c='blue',name='Globe',sub=2):
    segments=24 if r>=.35 else 16 if sub>1 else 12
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=12 if r>=.35 else 8,radius=r,location=(x,z,y))
    return finish(bpy.context.object,c,name,smooth=True)
def ring(x,y,z,r,t=.055,c='gold',axis='y',name='Ring',scale=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=40 if r>.65 else 24 if r>.3 else 18,minor_segments=8 if t>.09 else 6,location=(x,z,y),major_radius=r,minor_radius=t)
    o=bpy.context.object
    if axis=='z':o.rotation_euler.x=pi/2
    elif axis=='x':o.rotation_euler.y=pi/2
    if scale:o.scale=scale
    return finish(o,c,name,smooth=True)
def rod(a,b,r=.045,c='gold',name='Rail'):
    start=Vector((a[0],a[2],a[1]));end=Vector((b[0],b[2],b[1]));v=end-start
    bpy.ops.mesh.primitive_cylinder_add(vertices=12 if r>.065 else 8,radius=r,depth=v.length,location=(start+end)/2)
    o=bpy.context.object;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return finish(o,c,name,smooth=True)
def line(points,r=.04,c='blue',name='Connection'):
    # A single swept tube keeps flow lines and pipe elbows continuous rather
    # than a collection of capped, intersecting voxel-like cylinders.
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=2;curve.resolution_u=2;curve.use_fill_caps=True
    spline=curve.splines.new('POLY');closed=points[0]==points[-1];points=points[:-1] if closed else points
    spline.points.add(len(points)-1)
    for p,a in zip(spline.points,points):p.co=(a[0],a[2],a[1],1)
    spline.use_cyclic_u=closed
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object,c,name,smooth=True)
def disk(x=0,z=0,r=2.25,c='stone'):
    cyl(x,.12,z,r,.24,c,'Cut-stone circular terrace',vertices=48)
    ring(x,.244,z,r-.11,.016,'trim',name='Terrace edge inlay')
def terrace(w=4.8,d=3.9):
    box(0,.11,0,w,.22,d,'stone','Grounded stone terrace',bevel=.10)
    box(0,.26,.12,w-.25,.08,d-.28,'ivory','Upper terrace',bevel=.025)
    # Flush construction joints give stone scale without extruded voxel blocks.
    for x in [-w*.27,0,w*.27]:box(x,.3008,.12,.011,.0016,d-.40,'mortar','Paving joint',bevel=0)
    for z in [-d*.25,d*.25]:box(0,.3008,z+.12,w-.35,.0016,.011,'mortar','Paving joint',bevel=0)
    box(0,.308,d*.44,w-.44,.015,.04,'trim','Front stone nosing',bevel=.004)
def steps(x=0,z=1.8,w=1.25):
    for i in range(3):
        box(x,.12+i*.10,z-i*.17,w,.10,.50,'ivory','Entrance tread',bevel=.012)
        box(x,.171+i*.10,z-i*.17+.19,w-.08,.012,.023,'trim','Step nosing',bevel=.003)
def plant(x,z,s=.45):
    cyl(x,.42,z,.24,.28,'earth','Planter',r2=.29)
    ring(x,.56,z,.265,.025,'trim',name='Planter lip');cyl(x,.561,z,.243,.012,'soil','Recessed soil')
    rod((x,.52,z),(x,1.1*s+.6,z),.045,'green','Plant stem')
    for dx,dz in ((-.17,.02),(.14,.1),(0,-.13)):orb(x+dx,.65+s*.62,z+dz,s*.44,'leaf','Foliage',1)
def windows(x,y,z,w,h=.30,count=4,c='glass'):
    for i in range(count):
        xx=x-w/2+(i+.5)*w/count;ww=w/count*.66
        box(xx,y,z,ww+.07,h+.07,.065,'dark','Window reveal',bevel=.006)
        box(xx,y,z+.036,ww,h,.012,c,'Recessed glazing',bevel=.002)
        for dx in [-ww/2-.018,ww/2+.018]:box(xx+dx,y,z+.057,.027,h+.069,.032,'trim','Window jamb',bevel=.004)
        box(xx,y+h/2+.018,z+.058,ww+.064,.027,.038,'trim','Window head',bevel=.004)
        box(xx,y-h/2-.03,z+.075,ww+.105,.035,.09,'ivory','Stone window sill',bevel=.005)
        if ww>.43:box(xx,y,z+.053,.018,h,.025,'trim','Window mullion',bevel=0)
def doorway(x=0,y=.83,z=1):
    box(x,y,z,.60,1.09,.13,'dark','Recessed entrance');box(x,y,z+.068,.46,.99,.015,'glass','Entrance glazing')
    for dx in [-.285,.285]:box(x+dx,y,z+.09,.05,1.13,.09,'trim','Door jamb',bevel=.005)
    box(x,y+.55,z+.09,.67,.07,.13,'ivory','Door lintel');rod((x+.13,y-.09,z+.12),(x+.13,y+.12,z+.12),.015,'gold','Door pull')
def pavilion(x=0,z=0,w=3,d=2.2,h=1.35,c='teal'):
    box(x,.32+h/2,z,w,h,d,'ivory','Pavilion wall');box(x,.39,z,w+.035,.13,d+.035,'stone','Continuous foundation course')
    box(x,h+.34,z,w+.13,.09,d+.13,'dark','Roof shadow reveal')
    box(x,h+.42,z,w+.24,.10,d+.25,c,'Folded roof fascia')
    box(x,h+.493,z,w+.10,.045,d+.12,'trim','Roof coping')
    if w>1.7 and h>1.2:
        doorway(x-w*.31,.87,z+d/2+.05)
        windows(x+w*.15,.32+h*.58,z+d/2+.025,w*.53,min(.48,h*.38),max(2,int(w*.8)))
    else:windows(x,.32+h*.58,z+d/2+.025,w-.24,min(.48,h*.38),max(2,int(w*1.35)))
    for xx in [x-w/2+.07,x+w/2-.07]:box(xx,.32+h/2,z+d/2+.031,.06,h-.10,.035,'stone','Corner pilaster',bevel=.003)
def colonnade(x,y,z,w=3.8,n=5,h=1.6):
    for i in range(n):
        xx=x-w/2+i*w/(n-1);cyl(xx,y+h/2,z,.103,h,'ivory','Tapered column shaft',r2=.084,vertices=20)
        cyl(xx,y+.09,z,.145,.16,'stone','Column base moulding',vertices=20)
        cyl(xx,y+h-.015,z,.135,.09,'ivory','Column capital neck',vertices=20)
        box(xx,y+h+.057,z,.29,.08,.29,'ivory','Capital abacus',bevel=.01)
    box(x,y+h+.13,z,w+.36,.10,.42,'ivory','Architrave')
    box(x,y+h+.212,z,w+.42,.055,.48,'gold','Cornice moulding',bevel=.008)
def screen(x,y,z,w=1.5,h=1.1,c='blue'):
    panel(x,y,z,w+.10,h+.12,.13,'dark','Rounded display bezel',radius=.065)
    panel(x,y,z+.07,w,h,.022,c,'Display panel',radius=.035)
    box(x,y-h/2-.043,z+.075,w*.25,.013,.012,'trim','Display status strip',bevel=.004)
def phone(x,y,z,h=1.7,c='blue',r=0):
    panel(x,y,z,h*.49,h,.115,'trim','Rounded phone chassis',radius=h*.058)
    panel(x,y,z+.045,h*.465,h*.96,.048,'dark','Phone bezel',radius=h*.054)
    panel(x,y+.012,z+.073,h*.425,h*.85,.014,c,'Phone interface',radius=h*.041)
    box(x,y+h*.452,z+.080,h*.13,.022,.009,'dark','Earpiece',bevel=.006)
    box(x,y-h*.435,z+.083,h*.16,.018,.009,'trim','Gesture bar',bevel=.005)
def chair(x,z,c='teal'):
    box(x,.65,z,.58,.16,.6,c,'Seat');box(x,.95,z-.23,.58,.63,.12,c,'Seat back')
    for dx in [-.2,.2]:for_dummy=0;rod((x+dx,.35,z),(x+dx,.61,z),.045,'gold','Chair legs')
def person(x,y,z,c='orange',s=1):
    orb(x,y+.87*s,z,.17*s,'ivory','Avatar head',1);cyl(x,y+.5*s,z,.16*s,.43*s,c,'Avatar body',r2=.21*s,vertices=8)
    for dx in [-.1,.1]:rod((x+dx*s,y+.32*s,z),(x+dx*s,y,z),.055*s,'dark','Avatar legs')
    for side in [-1,1]:line([(x+side*.15*s,y+.63*s,z),(x+side*.24*s,y+.47*s,z+.01*s),(x+side*.24*s,y+.35*s,z+.07*s)],.047*s,c,'Avatar sleeve')
    cyl(x,y+.87*s,z,.175*s,.11*s,'earth','Short hair silhouette',vertices=16)
def robot(x,y,z,s=1,c='teal'):
    box(x,y+.6*s,z,.6*s,.6*s,.48*s,c,'Robot chassis');box(x,y+1.04*s,z,.72*s,.5*s,.45*s,'ivory','Robot head',bevel=.08*s)
    screen(x,y+1.04*s,z+.24*s,.51*s,.24*s,'ink')
    for dx in [-.14,.14]:box(x+dx*s,y+1.06*s,z+.34*s,.075*s,.055*s,.015*s,'blue','Robot eyes',bevel=.002)
    for dx in [-.2,.2]:box(x+dx*s,y+.2*s,z,.21*s,.32*s,.36*s,'dark','Robot feet')
def tree(x,z,s=.7):
    rod((x,.3,z),(x,1.3*s,z),.09*s,'earth','Tree trunk')
    for dx,dz,hh,rr,c in [(-.19,0,1.36,.39,'green'),(.20,.12,1.43,.40,'green'),(0,-.17,1.61,.42,'leaf'),(.08,0,1.85,.29,'leaf')]:
        orb(x+dx*s,hh*s,z+dz*s,rr*s,c,'Organic tree crown',1)
def solar(x,y,z,w=1.3,d=.8):
    box(x,y,z,w+.06,.10,d+.06,'trim','Photovoltaic frame',bevel=.01)
    box(x,y+.055,z,w,.025,d,'ink','Solar array',r=0,bevel=.006)
    for i in range(4):box(x-w*.38+i*w*.25,y+.067,z,.024,.013,d*.89,'blue','Photovoltaic grid',bevel=0)
    box(x,y+.067,z,w*.9,.015,.026,'blue','Photovoltaic grid',bevel=0)
def helix(x=0,z=0,y0=.45,h=2.7,r=.58,turns=1.5,c='gold'):
    for phase in [0,pi]:
        pts=[(x+r*cos(phase+i/28*turns*pi*2),y0+h*i/28,z+r*sin(phase+i/28*turns*pi*2)) for i in range(29)]
        line(pts,.055,c,'Helical trace')
    for i in range(0,29,3):
        a=i/28*turns*2*pi;rod((x+r*cos(a),y0+h*i/28,z+r*sin(a)),(x-r*cos(a),y0+h*i/28,z-r*sin(a)),.027,'ivory','Helix crosslink')
def vessel(x,y,z,h=1.8,r=.42,c='glass'):
    profile=[(r*.70,0),(r*.95,.025*h),(r,.07*h),(r*.92,.56*h),(r*.80,.72*h),(r*.64,.80*h),(r*.39,.84*h),(r*.36,.87*h),(r*.36,.96*h)]
    vertices=[];faces=[];segments=28
    for rr,yy in profile:
        for i in range(segments):a=i*pi*2/segments;vertices.append((x+rr*cos(a),z+rr*sin(a),y+yy))
    for j in range(len(profile)-1):
        for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
    faces.append(tuple(reversed(range(segments))))
    mesh=bpy.data.meshes.new('Formed bottle shell');mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new('Tapered formed bottle',mesh);bpy.context.collection.objects.link(obj);finish(obj,c,'Tapered formed bottle',smooth=True)
    cyl(x,y+h*.985,z,r*.43,h*.073,'gold','Reusable closure')
    for yy in [.96,.985,1.01]:ring(x,y+h*yy,z,r*.434,.008,'trim',name='Closure grip rib')
    ring(x,y+h*.25,z,r*.975,.014,'ivory');ring(x,y+h*.57,z,r*.916,.014,'ivory')
def crane(x,z,h=2.5,c='gold'):
    for dx in [-.12,.12]:rod((x+dx,.3,z),(x+dx,h,z),.048,c,'Gantry mast')
    rod((x-.8,h,z),(x+1,h,z),.065,c,'Gantry beam');rod((x+.75,h,z),(x+.75,h-.85,z),.018,'dark','Hoist cable')
    box(x+.75,h-.95,z,.22,.17,.24,'orange','Hoist hook')
def book(x,y,z,w=1.4,h=.22,d=1.05,c='orange'):
    box(x,y,z,w,h,d,'ivory','Book pages');box(x,y+h*.6,z,w+.07,.055,d+.05,c,'Book cover');box(x,y-h*.6,z,w+.07,.055,d+.05,c,'Book cover')
    box(x-w/2,y,z,.07,h+.13,d+.05,c,'Book spine')
def factory(x=0,z=-.25,c='teal'):
    pavilion(x,z,2.7,1.6,1.15,c)
    box(x,1.67,z+.14,3.0,.085,1.93,c,'Slim projecting workshop canopy')
    box(x,1.722,z+.14,2.91,.035,1.84,'trim','Canopy weather cap')
    for xx in [x-1.20,x+1.20]:rod((xx,.32,z+.96),(xx,1.62,z+.96),.033,'dark','Canopy steel post')
    box(x,1,z+.84,1.65,.98,.075,'dark','Workshop portal reveal')
    windows(x,1.18,z+.892,1.4,.52,3)
    box(x,.53,z+.915,1.48,.20,.04,c,'Workshop door kick plate',bevel=.008)
    for xx in [x-.48,x+.48]:rod((xx,.78,z+.96),(xx,.97,z+.96),.013,'gold','Workshop door pull')
def track(x=0,z=0,rx=1.7,rz=1.25):
    for r,c in [(0,'orange'),(.13,'ivory')]:
        pts=[(x+(rx-r)*cos(i*2*pi/36),.36,z+(rz-r)*sin(i*2*pi/36)) for i in range(37)]
        line(pts,.065 if not r else .018,c,'Running route')
def gear(x,y,z,r=.7,c='gold'):
    ring(x,y,z,r,.11,c,'z','Gear rim')
    for i in range(10):
        a=i*pi/5;o=box(x+cos(a)*r,y+sin(a)*r,z,.22,.18,.20,c,'Gear tooth',bevel=.02);o.rotation_euler.y=-a
def globe(x,y,z,r=.6,c='blue'):
    orb(x,y,z,r,c,'Simulation globe');ring(x,y,z,r*1.02,.018,'ivory','y','Latitude');ring(x,y,z,r*1.02,.018,'gold','z','Meridian')

FEATURES={}
def idea(project_id, summary, fn):FEATURES[project_id]=(summary,fn)

def windpanel():
    terrace();factory(-.65,-.42)
    # A roof duct on a testing bus, not an unrelated windmill silhouette.
    box(.45,.86,.95,2.6,.82,.86,'teal','Test bus');box(.45,1.3,.95,2.5,.12,.88,'ivory','Bus roof')
    windows(.45,1.02,1.395,2.36,.23,6)
    for x in [-.42,1.28]:
        for z in [.51,1.39]:
            o=cyl(x,.51,z,.23,.15,'dark','Bus wheel');o.rotation_euler.x=pi/2
            ring(x,.51,z+(.08 if z>1 else -.08),.105,.035,'trim','z','Wheel hub')
    box(1.775,1.04,.95,.035,.38,.68,'ink','Bus front windshield',bevel=.025)
    box(1.803,.67,.95,.10,.09,.87,'trim','Bus front bumper',bevel=.015)
    for zz in [.64,1.26]:box(1.80,.81,zz,.035,.09,.12,'white','Bus headlamp',bevel=.008)
    box(-.80,.76,.95,.025,.09,.75,'trim','Rear bumper',bevel=.006)
    box(.45,.62,1.417,2.47,.032,.04,'trim','Continuous bus sill',bevel=.006)
    box(.5,1.53,.95,1.65,.32,.64,'gold','Rooftop inlet enclosure');box(.5,1.54,1.29,1.3,.17,.035,'dark','Controlled inlet')
    for x in [-.04,.5,1.04]:ring(x,1.55,1.32,.11,.025,'ivory','z','Enclosed rotor')
    for z in [-.85,-.4,.05]:line([(-2.1,2.14,z),(-1.25,2.28,z),(-.5,2.15,z),(.4,2.42,z),(1.7,2.38,z)],.034,'blue','Wake-flow study')
    screen(-.7,1.25,-1.12,1.6,.55,'ink');plant(1.95,-1.35)
idea('windpanel','A testing bus with a shallow rooftop inlet, enclosed rotors, and curved wake-flow ribbons.',windpanel)

def webroker():
    terrace()
    for x,z,h,c in [(-1.35,-.45,2.05,'teal'),(-.15,-.8,3.25,'ink'),(1.2,-.25,2.55,'orange')]:
        box(x,h/2+.34,z,.95,h,.85,c,'Broker network tower')
        box(x,h+.355,z,1.01,.055,.91,'dark','Tower cornice reveal');box(x,h+.41,z,1.10,.055,1.0,'trim','Tower roof coping')
        box(x,h+.455,z,.82,.028,.72,'stone','Inset roof deck',bevel=.009)
        for y in [.7,1.15,1.6,2.05,2.5,2.95]:
            if y<h+.15:windows(x,y,z+.435,.76,.23,2)
        for xx in [x-.45,x+.45]:box(xx,h/2+.34,z+.455,.025,h-.11,.035,'trim','Vertical facade fin',bevel=.003)
        # Side glazing makes the corner view an inhabited volume, not a blank
        # extruded facade card.
        for yy in [.83,1.4,1.97,2.54]:
            if yy<h+.1:
                for zz in [z-.22,z+.16]:box(x+.485,yy,zz,.018,.28,.25,'glass','Side elevation glazing',bevel=.003)
        box(x,.57,z+.54,.48,.50,.08,'dark','Lobby recess',bevel=.012)
        box(x,.59,z+.587,.33,.40,.02,'glass','Lobby double doors',bevel=.004)
        box(x,.87,z+.61,.70,.05,.33,'trim','Entrance canopy',bevel=.007)
        rod((x,.48,z+.612),(x,.70,z+.612),.012,'gold','Lobby door pull')
    box(0,.45,1,3.55,.23,.78,'ivory','Meeting promenade')
    for x in [-1.25,0,1.25]:cyl(x,.68,1.02,.24,.2,'gold','Intent node');orb(x,.95,1.02,.18,'blue',sub=1)
    line([(-1.25,.93,1.02),(-.5,1.25,.2),(0,.93,1.02),(.5,1.25,.2),(1.25,.93,1.02)],.035,'blue','Intent connections')
    steps();plant(-2,-1.3)
idea('webroker','Three connected broker towers meet a shared intent promenade; visible links express matching instead of listings.',webroker)

def guru():
    terrace();steps(w=2.7)
    for i,(x,h,c) in enumerate([(-1.4,1.4,'teal'),(0,2.7,'gold'),(1.4,1.9,'orange')]):
        box(x,.43+i*.08,-.3,1.25,.22,1.7,'ivory','Mentor stage');colonnade(x,.54,-.06,.92,3,h)
        box(x,h+.80,-.35,1.35,.18,1.8,c,'Tier roof');cyl(x,h+1,-.35,.68,.28,c,'Temple crown',r2=.15,vertices=4)
    for x in [-1.4,0,1.4]:line([(x,.43,1.3),(x,.43,.65),(0,.43,.4)],.038,'gold','Guide routing')
idea('guru-engine','Three distinct mentor pavilions and branching paths express stage-specific guidance and guru loops.',guru)

def earths():
    disk();cyl(0,.45,0,1.8,.30,'ivory','Observatory floor',vertices=24)
    for x in [-1.65,1.65]:box(x,1.48,-.28,.24,2.3,.50,'ivory','Observatory frame')
    ring(0,1.8,-.30,1.63,.16,'ivory','z','Observatory arch')
    globe(0,1.65,-.3,.63)
    for i in range(7):
        a=i*2*pi/7;globe(1.27*cos(a),1.7+1.27*sin(a),-.27,.19,['blue','green','gold','pink','teal','purple','orange'][i])
    for x in [-.85,0,.85]:screen(x,.79,1.03,.55,.37,'ink')
idea('religion-earths','Eight equal simulation globes sit inside an open observatory orbit; no religion is given superior rank.',earths)

def swarm():
    disk();cyl(0,.50,0,1.75,.46,'ivory','Command rotunda',vertices=24)
    cyl(0,.84,0,1.3,.22,'teal','Command ring',vertices=24);orb(0,1.65,0,.62,'blue','Shared reasoning core')
    for i in range(6):
        a=i*pi/3;x,z=1.45*cos(a),1.45*sin(a);cyl(x,.74,z,.29,.58,'dark','Agent console');orb(x,1.14,z,.19,['gold','orange','pink','purple','green','blue'][i],sub=1)
        rod((x,.93,z),(0,1.39,0),.035,'gold','Agent collaboration link')
    for a in [0,pi/3,2*pi/3]:
        r=ring(0,1.7,0,.91,.035,'ivory','z','Reasoning orbit');r.rotation_euler.z=a
    robot(0,.28,1.85,.42)
idea('agent-swarm','Six role consoles surround a shared orbital core, with a small robot receiving tasks.',swarm)

def dream():
    terrace();box(-.72,1.10,-.30,1.7,1.55,2.2,'ivory','Design atelier');windows(-.72,1.06,.82,1.4,.65,3)
    box(-.72,1.94,-.3,1.9,.14,2.4,'teal','Atelier canopy');crane(1.2,-.9,2.6)
    cyl(.95,.65,.65,.78,.60,'dark','Living-world table',vertices=16);cyl(.95,.98,.65,.83,.08,'green','World terrain',vertices=16)
    for x,z,h in [(.55,.6,.65),(1,.3,1),(1.38,.8,.45)]:box(x,1.05+h/2,z,.32,h,.32,'gold','Idea model')
    rod((-.72,2.04,-.3),(-.72,2.65,-.3),.075,'gold','Idea lamp stem');orb(-.72,2.84,-.3,.40,'gold','Idea lamp');ring(-.72,2.75,-.3,.51,.027,'ivory')
    plant(-1.95,1.2)
idea('karmic-life','An open design atelier, construction arm, idea lamp, and miniature living world show ideas becoming places.',dream)

def solarcolony():
    terrace()
    for x,z,h in [(-1.2,-.5,1.05),(.25,-.6,1.5),(1.37,.68,.9),(-.55,.9,.8)]:
        box(x,.3+h/2,z,1.10,h,1.05,'ivory','Rooftop home');windows(x,.65,z+.55,.87,.25,2);solar(x,h+.37,z,1.23,1.05)
    box(1.60,.92,-.85,.43,1.2,.45,'teal','Shared battery');box(1.60,.97,-.61,.21,.45,.02,'blue','Battery meter')
    tree(-1.95,1.2,.67)
idea('solar-sales','A small neighborhood has photovoltaic rooftops and a shared battery, depicting the solar sales operation.',solarcolony)

def creatine():
    terrace();track(.25,.1,1.80,1.35)
    cyl(-.78,1.1,-.15,.58,1.52,'ivory','Sampling reservoir');cyl(-.78,1.91,-.15,.61,.16,'orange','Dispenser lid')
    box(-.78,1.05,.44,.63,.59,.03,'orange','Sampling label');box(.60,.88,-.27,1.15,.24,.66,'teal','Sampling counter')
    for x in [.25,.65,1.05]:rod((x,1,-.35),(x,1.5,-.35),.09,'gold','Dispenser');rod((x,1.5,-.35),(x,1.5,-.04),.065,'gold','Sampling nozzle')
    person(1.6,.33,.7,'teal',.65);tree(-1.9,-1.25,.67)
idea('creatine','A running loop surrounds a branded reservoir and three direct dispensing taps at a sampling counter.',creatine)

def biobottle():
    terrace();colonnade(0,.3,-1.05,3.6,4,1.7)
    box(0,2.2,-.9,4,.17,1.1,'green','Materials laboratory canopy')
    for x,h,c in [(-1.22,1.5,'glass'),(0,2.3,'blue'),(1.22,1.7,'glass')]:
        cyl(x,.45,.3,.54,.24,'teal','Bottle test stand');vessel(x,.58,.3,h,.42,c)
        for i in range(5):
            a=i*pi*2/5
            line([(x+rr*cos(a),.58+h*yy,.3+rr*sin(a)) for rr,yy in [(.416,.08),(.402,.3),(.391,.55),(.346,.71),(.276,.79)]],.010,'ivory','Conforming reinforcement fibre')
    plant(-1.85,1.2);plant(1.85,1.2)
idea('bio-bottle','Three tapered bottles show removable caps and visible reinforcement fibres beneath a materials testing canopy.',biobottle)

def gravityrail():
    terrace(5.4,3.8)
    for x,h in [(-1.8,2.9),(1.8,2.2)]:
        for z in [-.6,.1]:rod((x,.3,z),(x,h,z),.085,'ivory','Lift tower')
        box(x,h,-.25,.43,.20,1.2,'gold','Lift station head')
        for y in [.75,1.2,1.65]:rod((x-.1,y,-.6),(x+.1,y+.4,.1),.035,'teal','Lift tower bracing')
    for z in [-.5,0]:rod((-2.3,3,z),(2.3,2.12,z),.055,'dark','Sloping cargo rail')
    for x in [-1.22,0,1.22]:
        y=2.55-x*.19;rod((x,y,-.25),(x,y-.5,-.25),.045,'gold','Cargo hanger');box(x,y-.72,-.25,.70,.48,.6,'orange','Suspended bogey');windows(x,y-.72,.06,.50,.19,2)
    helix(-1.8,.95,.35,1.85,.26,2,'gold');box(-.55,.6,1.1,1.3,.28,.65,'teal','Loading conveyor')
idea('gravity-rail','Sloping suspended freight rails, hanging bogeys, tall lift stations, and an Archimedes loading screw.',gravityrail)

def rundna():
    terrace();track(0,0,1.9,1.37)
    helix(0,-.12,.42,2.50,.60,1.25,'gold')
    for x,z in [(-1.65,-.9),(1.7,.8)]:tree(x,z,.75)
    person(-1.30,.33,.92,'teal',.73);screen(1.4,.96,-.8,.50,.7,'ink')
idea('run-dna','An expressive running route rises into a double helix beside a watch-like metrics kiosk.',rundna)

def rudraksha():
    disk();cyl(0,.40,0,1.7,.28,'ivory','Meditation platform',vertices=20)
    for i in range(18):
        a=i*2*pi/18;x,y=1.15*cos(a),1.72+1.15*sin(a);bead=orb(x,y,-.30,.19,'earth','Grooved Rudraksha bead')
        for vertex in bead.data.vertices:
            longitude=math.atan2(vertex.co.y,vertex.co.x)
            groove=(.5+.5*cos(longitude*5+i*.17))**5
            vertex.co*=1-.055*groove
        ring(x,y,-.3,.184,.010,'gold','z','Mala thread')
    cyl(0,.63,.28,.7,.18,'orange','Meditation seat');phone(1.32,1,.8,1.1,'teal')
    for x in [-1.62,1.62]:cyl(x,.72,-.45,.12,.62,'gold','Shrine lamp');orb(x,1.08,-.45,.14,'gold',sub=1)
    rod((0,.66,-.30),(0,.36,-.30),.055,'gold','Mala tassel')
idea('rudraksha','An architectural ring of individually grooved mala beads frames a meditation seat and chant phone.',rudraksha)

def civic():
    terrace();pavilion(0,-.43,3.5,1.85,1.6,'teal');colonnade(0,.3,.71,3.2,6,1.7)
    box(0,2.22,-.35,3.9,.2,2.5,'ivory','Civic pediment');cyl(0,2.53,-.35,1.5,.40,'gold','Civic roof',r2=.07,vertices=4)
    screen(0,1.29,.965,2.18,.92,'ink')
    pts=[(-.85,.97,1.055),(-.45,1.15,1.055),(-.05,1.05,1.055),(.4,1.42,1.055),(.88,1.58,1.055)]
    line(pts,.025,'blue','Evidence timeline')
    for p in pts:orb(*p,.06,'gold',sub=1)
    steps(w=2.6)
idea('ministers','An open civic colonnade contains an evidence timeline with connected, timestamp-like nodes.',civic)

def drone(x,y,z,s=.8):
    box(x,y,z,.58*s,.21*s,.56*s,'ivory','Drone body');phone(x,y+.30*s,z,.52*s,'blue')
    for dx in [-.65,.65]:
        for dz in [-.65,.65]:
            rod((x,y,z),(x+dx*s,y,z+dz*s),.045*s,'dark','Drone arm');ring(x+dx*s,y+.03*s,z+dz*s,.23*s,.025*s,'teal',name='Rotor guard');box(x+dx*s,y+.04*s,z+dz*s,.43*s,.025*s,.07*s,'dark','Propeller',bevel=0)
def robotics():
    terrace();factory(0,-.65,'teal');box(0,.9,.21,1.7,.95,.05,'dark','Open robotics hangar')
    cyl(.2,.35,1,.88,.04,'teal','Landing pad',vertices=24);ring(.2,.39,1,.68,.026,'ivory',name='Landing pad marker');drone(.2,.75,1,.78)
    box(-1.7,.59,.55,.66,.33,.70,'orange','Rover');phone(-1.7,.99,.55,.65,'blue')
    for z in [.26,.84]:
        for x in [-1.99,-1.40]:orb(x,.43,z,.14,'dark',sub=1)
    box(1.70,.6,.4,.7,.22,1.1,'ivory','Phone-powered boat');phone(1.70,.99,.4,.57,'blue')
idea('robotics-core','A phone-equipped quadcopter shares a hangar with a phone rover and small boat.',robotics)

def coolant():
    terrace();box(0,.49,0,3.1,.40,2.2,'dark','Cooling base plate')
    for x,h in [(-.9,2.35),(.1,1.85),(1.08,2.75)]:
        cyl(x,h/2+.7,-.10,.36,h,'glass','Visible coolant reservoir');cyl(x,.73,-.10,.39,.13,'teal','Reservoir base');cyl(x,h+.72,-.10,.39,.13,'gold','Reservoir cap')
        for y in [.97,1.32,1.67]:ring(x,y,-.1,.365,.021,'blue',name='Coolant level')
    for x in [-.85,.9]:line([(x,.7,.55),(x,.7,1.0),(x,2.15,1.0),(0,2.15,1.0),(0,.5,.85)],.075,'teal','Heat-exchange pipe')
    for x in [-1.15,-.8,-.45,-.1,.25,.6,.95]:box(x,.53,1.02,.11,.45,.32,'ivory','Base heat-exchanger fin')
idea('cooling-stack','Blue coolant reservoirs, two exposed heat-exchange loops, and a finned cooler mounted at the base.',coolant)

def bodymetrics():
    terrace();box(0,.4,0,2.2,.2,2,'teal','Measurement platform');person(0,.5,0,'ivory',1.55)
    for x in [-1.05,1.05]:box(x,1.5,0,.16,2.25,.4,'ivory','Photogrammetry frame')
    box(0,2.65,0,2.26,.15,.40,'teal','Scanner canopy');phone(1.6,1.05,.75,1.3,'blue')
    for y in [.7,1.15,1.60,2.05]:rod((-.8,y,.20),(.8,y,.20),.018,'blue','Regional scan plane')
    box(-1.55,.49,1.0,.72,.25,.72,'dark','Verified weight scale')
idea('body-metrics','A figure in a photographic scan frame, a weight scale, and regional horizontal measurement lines.',bodymetrics)

def tracker():
    terrace();phone(-1.10,1.45,-.30,2.1,'teal');box(-1.1,.86,-.17,.48,.31,.035,'gold','One-tap journal button')
    for i in range(12):
        a=i*pi/6;h=.35+(i%5)*.24;x,z=.6+.85*cos(a),.15+.85*sin(a);box(x,.3+h/2,z,.22,h,.22,['blue','teal','gold'][i%3],'Frequency landscape column')
    ring(.6,.36,.15,1.1,.035,'orange',name='Radial session timeline')
idea('bong-tracker','A one-tap journal phone faces a radial frequency landscape and session timeline.',tracker)

def kinetics():
    terrace();person(0,.42,0,'teal',1.55)
    for x,y,z in [(-.63,1.56,0),(.63,1.8,0),(0,1.95,0),(-.15,.68,0),(.25,.83,.1)]:orb(x,y,z,.09,'gold',sub=1)
    line([(-.8,1.23,0),(-.5,1.58,0),(0,1.61,0),(.45,1.77,0),(.73,2.05,0)],.055,'teal','Captured arm pose')
    ring(0,1.58,0,1.17,.025,'blue','z','Motion arc');screen(-1.5,1.05,.92,.70,.75,'ink')
    box(1.5,.65,.7,.64,.30,.5,'dark','Wearable dock');ring(1.5,.91,.7,.26,.08,'gold',name='Watch band')
idea('kinetics','A joint-marked motion figure, surrounding pose arc, wearable watch dock, and movement screen.',kinetics)

def rigpulse():
    terrace();box(-.65,.63,0,2.4,.18,1.7,'dark','Laptop base');screen(-.65,1.48,-.70,2.08,1.52,'ink')
    for i,h in enumerate([.36,.76,.52,.95]):box(-1.4+i*.49,1.05+h/2,-.602,.24,h,.024,['blue','gold','orange','teal'][i],'Temperature telemetry')
    phone(1.35,1.27,.30,1.9,'teal');line([(.55,.7,.15),(.9,.7,.4),(1.1,.7,.4)],.035,'gold','Companion link')
    for x in [-1.15,-.35]:ring(x,.75,.1,.33,.04,'teal',name='Laptop cooling fan')
idea('rigpulse','An open telemetry laptop with fan grilles streams colored sensor bars to a companion phone.',rigpulse)

def ecosystem():
    disk();tree(0,0,1.5)
    for i in range(6):
        a=i*pi/3;x,z=1.45*cos(a),1.45*sin(a);box(x,.58,z,.6,.5,.6,['teal','gold','orange'][i%3],'Startup seed pavilion');rod((0,.40,0),(x,.40,z),.04,'blue','Ecosystem branch')
idea('aic-ecosystem','A living tree connects six startup pavilions across an incubator ecosystem.',ecosystem)

def cameras():
    terrace();pavilion(0,-.6,2.45,1.4,1.25,'teal')
    for x,z,h in [(-1.3,.75,1.7),(1.2,.3,2.4)]:
        cyl(x,h/2+.30,z,.08,h,'dark','Security mast');box(x,h+.42,z,.70,.36,.44,'ivory','Local AI camera');o=cyl(x,h+.42,z+.26,.13,.16,'ink','Camera lens');o.rotation_euler.x=pi/2;ring(x,h+.42,z+.355,.14,.025,'blue','z','Lens rim')
    box(0,.54,1,.73,.38,.64,'teal','Local inference unit');windows(0,.56,1.33,.5,.13,3)
idea('karmic-cameras','Two purpose-built security cameras with visible lenses connect to a local inference appliance.',cameras)

def vault():
    terrace();box(0,1.35,-.20,3,2.1,1.8,'ink','Game asset vault');box(0,1.35,.74,2.4,1.68,.10,'teal','Vault facade')
    ring(0,1.35,.87,.64,.14,'gold','z','Vault door');gear(0,1.35,.95,.36,'ivory')
    for x in [-1.75,1.75]:cyl(x,.58,.95,.22,.50,'gold','Achievement plinth');orb(x,.98,.95,.23,'blue',sub=1)
idea('games-vault','A circular vault door protects shared game assets, flanked by achievement trophies.',vault)

def passport():
    terrace();box(0,1.52,-.40,2.05,2.4,.5,'teal','Gamer identity passport');box(0,1.54,-.11,1.72,2.02,.035,'ivory','Passport page')
    person(-.36,1.10,.0,'orange',.63)
    for i in range(4):box(.48,1.78-i*.2,-.07,.46,.06,.025,'gold','Identity history line')
    for x,z,c in [(-1.5,.75,'pink'),(0,1.08,'gold'),(1.5,.75,'blue')]:
        cyl(x,.55,z,.33,.46,c,'Cross-game identity stamp');rod((x,.32,z),(0,.32,-.35),.036,'blue','Shared identity path')
idea('gamer-passport','A standing passport with avatar and history lines connects three game identity stamps.',passport)

def characters(variant='character-studio'):
    terrace();box(0,.42,0,3.7,.25,1.8,'dark','Character stage')
    colors=['teal','orange','purple'] if variant!='ghibliface' else ['green','pink','gold']
    for i,x in enumerate([-1.2,0,1.2]):
        cyl(x,.69,0,.40,.30,'ivory','Avatar turntable');person(x,.85,0,colors[i],1.1 if i==1 else .85)
    if variant=='character-studio':screen(0,2.2,-.6,1.6,.48,'blue')
    elif variant=='ghibliface':
        for x in [-1.75,1.75]:tree(x,.85,.80)
        ring(0,1.6,0,1.17,.05,'gold','z','Transformation frame')
    elif variant=='keltech-avatars':
        box(0,2.15,-.7,3.65,.26,.35,'gold','Company cast banner');box(0,.75,1.25,.9,.65,.45,'teal','Production camera pedestal')
    else:
        for x,c in [(-1.2,'earth'),(0,'gold'),(1.2,'blue')]:ring(x,1.55,-.2,.74,.045,c,'z','Era frame')
for id_,text in [
 ('character-studio','Three character turntables and an avatar control display form a reusable creation stage.'),
 ('ghibliface','Stylized character turntables sit inside a golden transformation frame and soft organic planting.'),
 ('keltech-avatars','A company ensemble of three reusable employee avatars faces a production camera pedestal.'),
 ('era-skins','Three generational figures occupy separate historical, transitional, and future era frames.')]:
    idea(id_,text,lambda q=id_:characters(q))

def filmstudio(kind):
    terrace();pavilion(0,-.55,3.4,1.4,1.35,'orange');screen(0,1.37,.21,2.53,1.19,'ink')
    if kind=='reels-studio':
        phone(0,1.42,.42,1.12,'pink')
        for x in [-1.70,1.70]:rod((x,.32,1.0),(x,1.7,1.0),.04,'dark','Studio light stand');box(x,1.78,1,.55,.50,.15,'gold','Softbox')
    elif kind=='knowledge-film':
        book(-1.05,.50,1.0,1.2,.18,.8);book(-1.05,.76,1.0,1.1,.14,.74,'teal');gear(.98,.78,1.15,.43,'gold')
        line([(-.4,.8,1),(.15,1.3,.65),(.65,1.4,.34)],.035,'blue','Knowledge to narrative')
    elif kind=='review-pages':
        phone(-1.02,1.44,.40,1.14,'blue');phone(1.02,1.44,.40,1.14,'pink');person(0,.34,1.3,'teal',.77)
        for x in [-.55,0,.55]:orb(x,2.18,.35,.1,'gold',sub=1)
    elif kind=='brand-studio':
        for i,c in enumerate(['gold','pink','teal','blue','orange']):cyl(-1.5+i*.75,.53,1,.23,.4,c,'Brand pigment')
        box(0,1.44,.37,1.2,.60,.04,'gold','Identity board');box(0,1.44,.41,.65,.15,.02,'ivory','Brand monogram')
    else:
        for i in range(9):box(-1.45+i*.36,1.15+(i%3)*.12,.35,.14,.45+(i%4)*.22,.10,['teal','gold','pink'][i%3],'Audio waveform')
        for x in [-1.7,1.7]:box(x,.88,1,.62,1.1,.62,'dark','Speaker');ring(x,.95,1.33,.20,.05,'blue','z','Speaker cone')
for id_,text in [
 ('reels-studio','A portrait-format recording stage has two softbox lamps and a vertical video screen.'),
 ('knowledge-film','Stacks of research books feed a narrative screen through a visible story-making gear.'),
 ('review-pages','Paired shop review phones face a customer recording position and a row of review markers.'),
 ('brand-studio','An identity board rises over an organized palette of pigment drums.'),
 ('wraithwave','A waveform facade and paired speaker stacks make an experimental audio mixing pavilion.')]:idea(id_,text,lambda q=id_:filmstudio(q))

def news():
    disk();pavilion(0,0,2.7,1.7,1.28,'teal');globe(0,2.18,0,.63)
    for x in [-1.6,1.6]:screen(x,.99,.75,.67,.85,'ink')
    ring(0,2.18,0,.85,.027,'gold','y','Global transmission')
idea('we-news','A world globe and transmission ring rise over a newsroom with paired news screens.',news)

def finance():
    terrace();colonnade(0,.3,-.25,3.2,5,1.35);box(0,1.83,-.25,3.7,.21,1.6,'teal','Finance hall roof')
    for i,h in enumerate([.4,.67,1.05,1.48]):
        for j in range(int(h/.12)):cyl(-1.25+i*.85,.37+j*.12,1,.29,.105,'gold','Ledger stack',vertices=12)
    line([(-1.25,.91,1.1),(-.40,1.2,1.1),(.45,1.52,1.1),(1.30,1.92,1.1)],.035,'blue','Finance planning curve')
idea('finance-os','A financial planning hall pairs coin-like ledger stacks with a planning curve, without asserting real wealth.',finance)

def legal():
    terrace();colonnade(0,.3,-.35,3.2,5,1.45)
    rod((0,.5,.85),(0,2.45,.85),.1,'gold','Scales pillar');rod((-1.2,2.22,.85),(1.2,2.22,.85),.065,'gold','Balance beam')
    for x in [-1.03,1.03]:
        for dx in [-.3,.3]:rod((x,2.22,.85),(x+dx,1.55,.85),.02,'gold','Scale chain')
        cyl(x,1.50,.85,.42,.1,'teal','Scale pan',r2=.34)
    book(0,.54,-.45,1.5,.21,1.1,'orange')
idea('legal-os','A balanced pair of legal scales stands in front of an open colonnade and a reference volume.',legal)

def investor():
    terrace();ring(0,1.65,-.28,1.26,.17,'gold','z','Investment gateway')
    for i,x in enumerate([-1.4,-.45,.5,1.45]):
        h=.55+i*.32;box(x,.3+h/2,.55,.60,h,.65,'teal','Venture growth plot');orb(x,h+.55,.55,.22,'leaf',sub=1)
    steps(w=2.6)
idea('investor-portal','A large gateway opens onto four venture growth plots, depicting discovery and investment pathways.',investor)

def talent():
    terrace();box(0,.44,0,3.5,.25,1.95,'teal','Talent forum');colonnade(0,.57,-.63,3,4,1.55)
    for x,c in [(-1.1,'orange'),(0,'purple'),(1.1,'blue')]:person(x,.58,.25,c,.95);ring(x,.42,.8,.25,.025,'gold',name='Skills node')
    line([(-1.1,.46,.8),(0,.46,1.3),(1.1,.46,.8)],.035,'blue','Skill-matching path')
idea('talent-os','An open talent forum connects three distinct people through visible skill-matching routes.',talent)

def patentvault():
    terrace();box(0,1.12,-.20,3.2,1.65,1.8,'teal','Patent archive');box(0,2.02,-.20,3.4,.16,2,'gold','Archive cornice')
    for x in [-1.05,-.35,.35,1.05]:
        for y in [.72,1.32]:box(x,y,.74,.48,.45,.12,'ivory','Patent drawer');box(x,y,.81,.17,.04,.03,'gold','Drawer pull')
    ring(0,2.6,-.2,.48,.055,'gold','z','Idea archive seal');orb(0,2.6,-.2,.24,'blue',sub=1)
idea('ip-vault','A structured archive has visible patent drawers and an invention seal, giving intellectual property a home.',patentvault)

def analytics():
    terrace();box(0,.46,0,3.9,.25,2.6,'dark','Analytics desk')
    for i,h in enumerate([.70,1.2,1.7,2.4]):box(-1.36+i*.9,.59+h/2,-.40,.56,h,.85,['blue','teal','gold','orange'][i],'Analytical tower')
    for x in [-1.2,0,1.2]:screen(x,.95,1,.82,.5,'ink')
    line([(-1.4,1.1,0),(-.5,1.45,0),(.4,2.2,0),(1.3,2.8,0)],.034,'ivory','Analytical trace')
idea('analytics','Four data towers and a linked trend trace sit behind three analysis consoles.',analytics)

def gateway():
    terrace()
    for x in [-1.35,1.35]:box(x,1.65,0,.67,2.7,.8,'teal','Gateway pier');windows(x,1.72,.42,.44,.6,1)
    box(0,3.08,0,3.55,.35,.94,'ivory','API bridge lintel')
    for x in [-1.05,-.35,.35,1.05]:box(x,3.09,.5,.35,.13,.035,'gold','Endpoint marker')
    for z in [-1.4,1.35]:
        for x in [-1.1,0,1.1]:cyl(x,.38,z,.17,.14,'blue','API terminal');rod((x,.38,z),(0,.38,0),.03,'gold','API route')
idea('api-gateway','A traversable monumental gateway connects six endpoint routes through a shared interface.',gateway)

def webuild():
    terrace();factory(-.5,-.25,'orange');crane(1.5,-.80,2.95)
    for x,z,h in [(.65,.8,.65),(1.45,1.05,.4),(-1.6,1.25,.55)]:box(x,.3+h/2,z,.67,h,.68,'ivory','Construction module')
    rod((-1.6,1.95,-.45),(.8,1.95,-.45),.06,'gold','Workshop truss')
idea('webuild','A shared makers yard combines a construction crane, workshop truss, and reusable building modules.',webuild)

def circular():
    terrace();factory(0,-.6,'green');box(-1.0,.92,.63,.7,1.15,.76,'earth','Waste hopper')
    line([(-.6,.88,.65),(0,.88,.65),(.7,.88,.65)],.18,'teal','Extrusion conduit')
    for x in [.9,1.45]:
        ring(x,1.15,.67,.47,.13,'gold','z','Recycled filament spool');cyl(x,.47,.45,.18,.3,'teal','Spool foot')
    for x,z in [(-1.8,.8),(-1.55,1.3),(-1.95,1.35)]:orb(x,.48,z,.19,'earth','Material feedstock',1)
idea('circular-materials','Waste feedstock enters an extrusion line and emerges as two large printable filament spools.',circular)

def rftattoo():
    terrace();cyl(0,1.28,0,.72,1.88,'ivory','Wearable surface exhibit',r2=.59,vertices=16)
    for r in [.31,.53,.76]:ring(0,1.43,.76,r,.025,'gold','z','Conductive RF pattern')
    line([(-1.8,.40,1.3),(-1.8,1.35,.7),(-1.2,1.7,.4)],.048,'teal','RF reader')
    screen(1.45,1.02,1,.6,.9,'ink')
idea('rf-tattoos','A curved wearable surface carries concentric conductive traces beside an RF measurement reader.',rftattoo)

def greenlab():
    terrace();box(0,.82,0,3.2,1.05,2.15,'glass','Greenhouse lab');box(0,1.45,0,3.45,.17,2.35,'green','Greenhouse roof')
    for x in [-1.6,-.8,0,.8,1.6]:rod((x,.32,1.08),(x,1.6,1.08),.045,'ivory','Greenhouse frame')
    for x in [-1.15,0,1.15]:plant(x,1.4,.6)
    solar(-.7,1.6,-.2,1.5,1.5);vessel(.95,1.55,-.3,.8,.2,'blue')
idea('green-lab','A framed greenhouse laboratory combines plants, a solar roof, and a small experiment vessel.',greenlab)

def sanskrit():
    disk();book(0,.58,0,2.8,.35,2,'orange');book(0,1.03,0,2.5,.25,1.78,'teal')
    ring(0,2.0,0,.87,.07,'gold','z','Language grammar wheel')
    for i in range(8):
        a=i*pi/4;orb(.87*cos(a),2+.87*sin(a),0,.095,'blue',sub=1);rod((0,2,0),(.70*cos(a),2+.70*sin(a),0),.025,'gold','Language relation')
    box(0,2,0,.45,.55,.4,'ivory','Grammar core')
idea('sanskrit-agi','Reference volumes support a radial grammar wheel whose connected nodes represent language structures.',sanskrit)

def recycler():
    terrace();box(-.82,.91,-.10,1.2,1.2,1.6,'teal','Recycling machine');solar(-.82,1.72,-.1,1.8,1.95)
    cyl(.9,.97,-.10,.55,1.25,'ivory','Solar recycling drum');ring(.9,1.04,-.1,.57,.05,'gold')
    line([(-.2,1,-.1),(.3,1,-.1),(.9,1,-.1)],.18,'dark','Material transfer pipe')
    for x in [.4,1,1.6]:box(x,.48,1.15,.45,.32,.57,'orange','Recycled output block')
idea('plastic-recycler','A photovoltaic roof powers a compact recycling chamber connected to sorted output blocks.',recycler)

def memory():
    terrace();phone(-1.15,1.35,.15,2.0,'blue');box(.68,1.22,-.30,1.5,1.8,1.55,'teal','Memory library')
    for i in range(4):box(.68,.66+i*.35,.51,1.16,.18,.05,'ivory','Stored memory drawer')
    for x,y,z in [(-.38,1.48,.10),(-.05,1.63,.05),(.25,1.73,0)]:box(x,y,z,.28,.35,.06,'gold','Captured document')
    book(.68,2.2,-.30,1.25,.12,.95,'orange')
idea('capture-memory','Captured documents flow from a phone into a library of persistent memory drawers.',memory)

def edgecore():
    terrace();box(0,1.33,-.3,1.35,2.02,1.4,'dark','Home reasoning core')
    for y in [.75,1.2,1.65,2.1]:windows(0,y,.42,1.05,.19,3,'blue')
    phone(-1.5,.98,.75,1.25,'teal');ring(1.50,.95,.70,.35,.12,'gold','z','Watch edge node')
    line([(-1.5,.42,.75),(0,.42,-.1),(1.5,.42,.7)],.04,'gold','Personal edge network')
idea('edge-core','A home reasoning server connects a phone and a watch as personal edge nodes.',edgecore)

def sync():
    terrace();screen(0,1.53,-.3,3.2,1.75,'ink');box(0,.44,-.3,1.45,.22,.75,'dark','TV stand')
    for x,c in [(-1.8,'pink'),(1.8,'blue')]:box(x,1.52,-.35,.11,2.18,.15,c,'TV reactive light edge')
    for x,c in [(-1.2,'orange'),(0,'gold'),(1.2,'teal')]:box(x,2.53,-.35,1.07,.10,.15,c,'Reactive light gradient')
    cyl(0,.65,1.1,.33,.32,'ivory','Camera puck');o=cyl(0,.7,1.28,.10,.1,'ink','Puck lens');o.rotation_euler.x=pi/2
idea('sync','A large television is surrounded by color-reactive edge lighting, watched by a dedicated camera puck.',sync)

def spatial():
    terrace();phone(0,1.60,-.30,2.5,'teal')
    for x,z in [(-1.45,.7),(1.45,.7)]:
        box(x,1.1,z,.45,.75,.15,'ivory','Gesture palm')
        for i in range(4):rod((x-.18+i*.12,1.35,z),(x-.18+i*.12,1.95-abs(i-1.5)*.12,z),.04,'gold','Gesture finger')
    ring(0,1.73,0,1.68,.025,'blue','z','Spatial interaction boundary');rod((1.3,.35,-.95),(1.3,2.25,-.95),.055,'purple','S Pen stylus')
idea('spatial-engine','A tall phone is framed by articulated gesture hands, an interaction boundary, and a stylus.',spatial)

def rwa():
    terrace()
    for x,z,h in [(-1.2,-.45,1.4),(0,-.5,2),(1.2,-.45,1.15)]:pavilion(x,z,.94,.97,h,'teal')
    cyl(0,.55,1,.76,.45,'gold','Resident council table')
    for x in [-1.25,1.25]:person(x,.3,1,'orange',.7)
    ring(0,.82,1,.62,.032,'blue',name='Participation ledger')
idea('rwa','Three apartment blocks face a shared resident council table and a circular participation ledger.',rwa)

def pets():
    terrace();box(-.65,.80,-.35,1.4,1,1.4,'ivory','Pet shelter');cyl(-.65,1.54,-.35,1.08,.6,'teal','Pet shelter roof',r2=.05,vertices=4)
    box(-.65,.74,.4,.55,.85,.06,'dark','Pet doorway')
    for x,z in [(.45,.35),(1.1,.9)]:
        orb(x,.62,z,.28,'orange','Cat body',1);orb(x,.93,z+.15,.2,'ivory','Cat head',1)
        for dx in [-.13,.13]:cyl(x+dx,1.10,z+.14,.08,.17,'orange','Cat ear',r2=0,vertices=3)
    tree(1.6,-.9,.8);box(0,.35,1.48,2.7,.12,.32,'green','Pet comfort path')
idea('pet-comfort','A welcoming pet shelter, two stylized cats, and a planted comfort path make the apartment pet ledger spatial.',pets)

def ropes():
    terrace();box(0,1.57,-.60,3.6,2.55,.25,'ivory','Storage wall')
    for x in [-1.25,0,1.25]:
        for y in [.62,1.28,1.94,2.61]:orb(x,y,-.37,.065,'gold',sub=1)
    for y in [.62,1.28,1.94]:
        line([(-1.25,y+.4,-.32),(-1.25,y,.32),(1.25,y,.32),(1.25,y+.4,-.32)],.034,'orange','Tensioned storage rope')
        for x in [-.75,.1,.80]:box(x,y+.20,.01,.45,.32,.52,'teal','Stored item')
idea('rope-storage','A tall anchor wall supports three suspended rope slings with everyday stored objects.',ropes)

def iron():
    terrace();box(0,.81,0,3.5,.20,1.45,'ivory','Thin magnetic ironing base')
    for x in [-1.15,1.15]:rod((x,.3,-.45),(-x,.74,.45),.07,'teal','Ironing board support')
    for x in [-1.3,-.65,0,.65,1.3]:box(x,.92,0,.018,.012,1.3,'gold','Ferromagnetic grid',bevel=0)
    for z in [-.5,0,.5]:box(0,.92,z,3.2,.013,.018,'gold','Ferromagnetic grid',bevel=0)
    cyl(0,1.12,0,.70,.32,'teal','Magnetic iron shell',r2=.50,vertices=3)
    ring(0,1.52,0,.38,.065,'gold','z','Modular iron handle')
idea('magnetic-iron','A lightweight ironing board exposes its thin ferromagnetic grid beneath a compact modular iron.',iron)

def periodic():
    terrace();box(0,1.47,-.20,3.8,2.25,.35,'dark','Personality periodic wall')
    for i in range(6):
        for j in range(3):
            if not (j==2 and i in [2,3]):box(-1.52+i*.61,.68+j*.62,.015,.48,.48,.12,['teal','gold','orange','pink','blue','purple'][(i+j)%6],'Personality element')
    for x,c in [(-.60,'orange'),(.60,'blue')]:orb(x,.75,1.15,.34,c)
    rod((-.28,.75,1.15),(.28,.75,1.15),.065,'gold','Personality bond')
idea('personality-elements','A colorful periodic arrangement of personality elements accompanies two visibly bonded spheres.',periodic)

def automation():
    terrace();box(0,.6,0,3.9,.28,1.2,'ivory','Comparison platform');person(-1.25,.77,0,'orange',1.1);robot(1.2,.77,0,1.1)
    rod((0,.8,.85),(0,2.5,.85),.08,'gold','Economic comparison pillar');rod((-1.7,2.4,.85),(1.7,2.4,.85),.055,'gold','Payback balance')
    screen(0,1.40,1.1,.60,.65,'ink')
idea('automation-economics','A person and robot share a balanced comparison platform with a central payback display.',automation)

def wake():
    terrace();box(0,.55,0,3.6,.40,1.8,'dark','Flow test bench')
    for z,c,amp in [(-.55,'blue',.06),(.6,'gold',.30)]:
        line([(x/8,1.45+sin(x*.9)*amp,z) for x in range(-16,17)],.035,c,'Clean or disturbed flow trace')
        ring(1.0,1.45,z,.48,.09,'teal','z','Recoverability test rotor')
    screen(-1.42,1.06,1.03,.64,.62,'ink');box(0,.6,1.1,.8,.12,.28,'orange','Measurement interface')
idea('wake-recoverability','Parallel smooth and disturbed flow traces pass through matched experimental rotor stations.',wake)

def chase():
    terrace()
    for x,z,w,h,d in [(-1.3,-.45,1.2,.9,.8),(.95,.65,1.25,.65,1.1),(.25,-1.1,.8,.4,.65)]:box(x,.3+h/2,z,w,h,d,'teal','Chase obstacle')
    for x in [-1.8,1.8]:rod((x,.3,-1),(x,2.05,-1),.065,'gold','Obstacle frame')
    rod((-1.8,2.05,-1),(1.8,2.05,-1),.065,'gold','Traverse bar');person(.1,.3,1.20,'orange',.9)
    line([(-1.85,.36,1.3),(-.8,.36,.5),(.1,.36,.2),(1.5,.36,-.6)],.024,'ivory','Chase route')
idea('chase-tag','A purposeful chase-tag arena has platforms, overhead bars, and a winding running route.',chase)

def merch():
    terrace();factory(0,-.55,'orange')
    for x,c in [(-1.20,'teal'),(0,'orange'),(1.20,'purple')]:
        cyl(x,.66,1,.45,.25,'ivory','Merchandise stand');orb(x,1.12,1,.42,c,'Cap crown');box(x,1.00,1.35,.75,.08,.55,c,'Cap brim')
    gear(0,2.12,-.6,.4,'gold')
idea('titanium-merch','A merchandise workshop presents three custom caps with distinct crowns and brims.',merch)

def mih():
    terrace();factory(-.55,-.4,'orange');crane(1.38,-.8,2.85)
    box(-.7,.60,1,1.45,.40,.75,'dark','Visitor demonstration bench');gear(-.7,1.27,1,.48,'gold')
    for x in [-1.8,1.7]:person(x,.3,1.15,'teal',.67)
    box(0,.38,-1.62,4.5,.16,.15,'green','Protected perimeter')
idea('mih-hub','A workshop and crane host a public demonstration bench, visitor figures, and a protected perimeter.',mih)

def vehicle():
    terrace();box(0,.82,0,3.30,.7,1.55,'ink','Experimental vehicle chassis');box(-.25,1.29,-.08,1.50,.55,1.23,'teal','Vehicle cabin');windows(-.25,1.34,.55,1.18,.30,3)
    for x in [-1.16,1.18]:
        for z in [-.84,.84]:
            o=cyl(x,.64,z,.39,.26,'dark','Large experimental wheel');o.rotation_euler.x=pi/2
            ring(x,.64,z+(.14 if z>0 else -.14),.22,.045,'gold','z','Wheel hub')
    for x in [-1.5,1.5]:box(x,.92,.80,.24,.20,.07,'blue','Vehicle lamp')
    box(.70,1.47,0,.42,.18,1.40,'gold','Sensor bridge')
idea('experimental-vehicle','A low experimental vehicle has oversized wheels, an enclosed cockpit, light bars, and a sensor bridge.',vehicle)

def patentdiscover():
    terrace();book(-.7,.51,.4,1.6,.28,1.4,'teal');book(-.7,.91,.4,1.4,.18,1.2,'orange')
    ring(.85,1.98,-.15,.71,.10,'gold','z','Discovery lens');rod((.85,1.25,-.15),(1.5,.50,.0),.105,'gold','Discovery lens handle')
    orb(.85,1.98,-.15,.30,'blue','Promising invention');crane(-1.6,-1.1,2.3,'teal')
idea('patent-discovery','A large discovery lens examines a new invention beside a library of submitted designs.',patentdiscover)

def selfmodel():
    disk();person(0,.4,0,'ivory',1.65)
    for i,c in enumerate(['orange','gold','green','teal','blue','purple']):orb(0,.8+i*.26,.30,.08,c,sub=1)
    for r in [1.02,1.37]:ring(0,1.58,0,r,.025,'gold','z','Hypothetical field boundary')
    screen(-1.65,1.01,.8,.55,.80,'ink')
idea('distributed-self','A human figure is surrounded by clearly illustrative field rings and internal mapping nodes.',selfmodel)

def makerbay():
    terrace();factory(0,-.45,'teal');box(-1.00,.85,.87,1.05,.65,.95,'dark','3D printer base')
    for x in [-1.47,-.53]:rod((x,1.17,.43),(x,2.25,.43),.06,'gold','Printer frame');rod((x,1.17,1.28),(x,2.25,1.28),.06,'gold','Printer frame')
    box(-1,2.25,.87,1.10,.15,.98,'ivory','Printer gantry');cyl(-1,1.42,.87,.2,.36,'orange','Printed part')
    box(1.05,.77,.87,1,.3,1,'teal','Electronics bench');robot(1.05,.94,.85,.60)
idea('maker-bay','An open physical workshop has a working-form 3D printer, a printed object, and an electronics bench.',makerbay)

def bridge():
    terrace();phone(-1.3,1.38,0,2,'blue');box(.9,1.02,0,1.7,1.45,1.4,'teal','Experimental machine');gear(.9,1.08,.75,.48,'gold')
    line([(-.8,.55,.6),(0,.55,1.12),(.9,.55,.85)],.072,'orange','Machine control cable')
    screen(.9,1.8,0,.85,.36,'ink')
idea('machine-bridge','A phone connects through a visible control cable to a geared experimental machine.',bridge)

def stars():
    disk();cyl(0,.60,0,1.55,.6,'ink','Celestial registry dais',vertices=20)
    ring(0,1.55,0,1.08,.06,'gold','z','Celestial coordinate ring');ring(0,1.55,0,1.08,.06,'gold','x','Celestial coordinate ring')
    for x,y,z,r in [(0,1.55,0,.30),(-1.28,2.5,.2,.12),(1.45,1.7,.1,.15),(.4,2.75,0,.1)]:orb(x,y,z,r,'gold','Catalogued star',1)
    book(0,.98,1.07,1.2,.16,.75,'teal')
idea('star-registry','A celestial coordinate instrument, star markers, and a registry book evoke cultural naming and cataloguing.',stars)

def ludo():
    terrace();box(0,.55,0,3.25,.4,3.05,'ivory','Civilization board')
    for x,z,c in [(-1,-.95,'teal'),(1,-.95,'orange'),(-1,.95,'purple'),(1,.95,'gold')]:
        box(x,.79,z,1.07,.09,1.02,c,'Ludo territory');cyl(x,1.04,z,.21,.38,c,'Civilization pawn');orb(x,1.32,z,.18,'ivory',sub=1)
    box(0,1.18,0,.62,.70,.62,'teal','Central civilization');ring(0,1.72,0,.5,.04,'gold',name='Time layer')
idea('ludo','A four-territory board, civilization pawns, and a raised time-layer city express the 4D Ludo exploration.',ludo)

def evaluation():
    terrace();box(0,.61,0,3.4,.5,2.4,'dark','Idea testing table');orb(0,1.36,0,.45,'gold','Idea under review')
    for x,c in [(-1.2,'red'),(1.2,'blue')]:
        box(x,1.42,0,.45,1.42,.7,c,'Opposing critique column');rod((x,1.48,0),(x*.45,1.48,0),.075,'ivory','Challenge probe')
    screen(0,1.05,1.27,1.65,.45,'ink');ring(0,1.37,0,.75,.035,'teal','z','Evaluation lens')
idea('idea-evaluation','Two opposing critique probes examine an idea in a dedicated testing rig.',evaluation)

def portals():
    terrace()
    for x,c in [(-1.2,'teal'),(1.2,'orange')]:
        ring(x,1.62,0,.93,.14,c,'z','Spatial portal');box(x,.49,0,1.55,.30,.70,'ivory','Portal footing');person(x,.5,.07,'ivory',.77)
    line([(-1.2,.38,1),(0,.38,1.42),(1.2,.38,1)],.046,'gold','Distant-presence bridge')
idea('portals','Two full-height spatial portals each contain a person and connect through a shared presence path.',portals)

def multiai():
    disk();cyl(0,.86,0,1.21,.20,'ivory','Shared conversation table',vertices=20)
    for i,c in enumerate(['orange','teal','purple']):
        a=i*pi*2/3;x,z=1.46*cos(a),1.46*sin(a);cyl(x,.60,z,.36,.59,c,'Participant console');orb(x,1.32,z,.29,c);rod((x,1,z),(0,1.0,0),.035,'gold','Cross reasoning link')
    orb(0,1.44,0,.30,'blue','Shared thread')
idea('multi-ai','Three distinct participants gather around one shared thread with visible cross-reasoning links.',multiai)

def podcast():
    terrace();box(0,.97,0,3.75,.22,1.4,'earth','Podcast table');robot(-1.25,.31,-.70,.86);robot(1.25,.31,-.70,.86,'purple');person(0,.3,-.77,'orange',1.1)
    for x in [-1.2,0,1.2]:rod((x,1.08,.4),(x,1.5,.3),.024,'dark','Microphone stand');cyl(x,1.57,.3,.075,.20,'gold','Podcast microphone')
    for x in [-1.65,1.65]:box(x,1.9,-1.3,.14,2.85,.12,'teal','Studio acoustic frame')
idea('robot-podcast','A host and two robot co-hosts sit at a real podcast table with individual microphones.',podcast)

def cluster():
    terrace()
    for x,z,h in [(-1.3,-.55,1.65),(0,-.6,2.5),(1.3,-.55,1.20)]:
        box(x,.3+h/2,z,.95,h,1,'dark','Compute node')
        for y in [.63,1,1.37,1.74,2.11,2.48]:
            if y<h+.2:windows(x,y,z+.52,.72,.13,3,'blue')
        line([(x,.38,z),(x,.38,1),(0,.38,1)],.035,'gold','Compute pool interconnect')
    phone(0,1,1.05,1.2,'teal')
idea('compute-cluster','Different-sized compute towers share a gold interconnect and a phone node.',cluster)

def chess():
    terrace();box(0,.46,0,3.8,.25,2.7,'ivory','AI scenario board')
    for i in range(6):
        for j in range(4):box(-1.55+i*.62,.60,-.93+j*.62,.60,.04,.60,'teal' if (i+j)%2 else 'ivory','Chess square',bevel=0)
    for x,h in [(-1.25,.75),(0,1.35),(1.25,2.1)]:
        cyl(x,.80,0,.32,.36,'gold','AI stage foot');cyl(x,1+h*.28,0,.22,h*.60,'ivory','AI chess stage',r2=.13);orb(x,1.08+h*.62,0,.23,'gold')
    box(1.25,2.80,0,.48,.10,.11,'gold','King cross');box(1.25,2.80,0,.10,.48,.11,'gold','King cross')
idea('ai-chess','Pawn-to-king pieces rise across a chessboard to show divergent stages of AI evolution.',chess)

def timeuse():
    terrace()
    for x,c in [(-1.35,'teal'),(0,'gold'),(1.35,'orange')]:
        cyl(x,.63,0,.47,.60,'ivory','Time allocation plinth');ring(x,1.56,0,.60,.075,c,'z','24-hour clock')
        rod((x,1.56,0),(x,1.99,0),.025,'dark','Clock hand');rod((x,1.56,0),(x+.29,1.30,0),.025,'dark','Clock hand')
        for i in range(12):a=i*pi/6;orb(x+.51*cos(a),1.56+.51*sin(a),0,.033,'gold',sub=1)
    box(0,.43,1.1,3.7,.2,.45,'teal','Equal-day comparison')
idea('time-use','Three equal-sized 24-hour clocks compare different reference-class allocations of the same day.',timeuse)

def freedom():
    terrace();track(0,0,1.8,1.1)
    for x,side in [(-.65,-1),(.65,1)]:
        ring(x,1.40,0,.40,.11,'teal','z','Opened dependency link');box(x+side*.42,1.40,0,.17,.68,.28,'gold','Opening link end')
    person(0,.30,1.22,'orange',.90);tree(-1.70,-1.0,.90);tree(1.70,-1.0,.75)
idea('smoking-freedom','An open walking route passes between separated dependency links and growing trees.',freedom)

def fourlog():
    terrace()
    for x,z,h,c in [(-1,-.7,.35,'teal'),(1,-.7,.7,'orange'),(-1,.8,.55,'purple'),(1,.8,1,'blue')]:
        box(x,.3+h/2,z,1.15,h,1.04,c,'Reference-class platform');person(x,h+.3,z,'ivory',.72)
    ring(0,1.48,0,.5,.055,'gold','z','Reference comparison lens')
idea('four-log','Four people occupy different reference-class platforms around a comparison lens.',fourlog)

def thermal():
    terrace();phone(-.65,1.55,0,2.5,'ink')
    for i in range(4):
        for j in range(7):box(-1.07+i*.28,.64+j*.27,.103,.255,.245,.023,['blue','teal','gold','orange','red'][min(4,abs(i-1)+abs(j-3)//2)],'Sensor exploration heatmap',bevel=.008)
    o=cyl(1.23,1.33,.10,.43,.32,'ivory','Sensor investigation optic');o.rotation_euler.x=pi/2;ring(1.23,1.33,.3,.31,.06,'teal','z','Sensor lens')
    rod((1.23,.31,.1),(1.23,1.05,.1),.09,'gold','Optics stand')
idea('thermal-phone','A phone shows an illustrative heatmap beside an optical investigation stand; it does not assert thermal hardware capability.',thermal)

def fnv(value):
    n=2166136261
    for ch in value:n=((n^ord(ch))*16777619)&0xffffffff
    return format(n,'08x')

source=open(os.path.join(ROOT,'src','inventory.ts'),encoding='utf-8').read()
catalogue=re.findall(r"add\('([^']+)','([^']+)',(\d+),'([^']+)'",source)
if not catalogue:
    # The public mirror deliberately keeps only project definitions, not diary
    # entries. Its sanitized inventory is a typed JSON array.
    array=re.search(r'export\s+const\s+inventionProjects\s*:\s*Project\[\]\s*=\s*(\[.*?\]);',source,re.S)
    if array:
        catalogue=[(p['id'],p['zone'],str(p['plot']),p['name']) for p in json.loads(array.group(1))]
if not catalogue:raise RuntimeError('No project inventory found; refusing an empty asset build.')
missing=[p[0] for p in catalogue if p[0] not in FEATURES]
if missing:raise RuntimeError('Missing specific idea recipe: '+', '.join(missing))
manifest=[];library=[]
for index,(pid,zone,plot,title) in enumerate(catalogue):
    parts=[];FEATURES[pid][1]()
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:
        bpy.context.view_layer.objects.active=o;o.select_set(True)
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
        color=o.data.materials[0].diffuse_color[:]
        attr=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
        for entry in attr.data:entry.color=color
        o.data.materials.clear();o.data.materials.append(vertex_material)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();mesh=bpy.context.object;mesh.name=title
    bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    mesh['projectId']=pid;mesh['truthState']='FANTASY_WORLD';mesh['architectureVersion']=3;mesh['artRevision']=4;mesh['generator']='Blender';mesh['visibleFeatures']=FEATURES[pid][0]
    # glTF maps Blender +Y to -Z. Turn authored fronts toward the game's +Z
    # camera without reflections or inverted normals.
    mesh.rotation_euler.z=pi
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    # Apply triangulation so source, count, and GLB match exactly.
    tri=mesh.modifiers.new('Realtime triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
    bounds=[list(min(v.co[i] for v in mesh.data.vertices) for i in range(3)),list(max(v.co[i] for v in mesh.data.vertices) for i in range(3))]
    # Blender Z is glTF Y; Blender Y becomes -glTF Z. Pivot remains grounded.
    gltf_bounds={'min':[bounds[0][0],bounds[0][2],-bounds[1][1]],'max':[bounds[1][0],bounds[1][2],-bounds[0][1]]}
    filename='idea-'+fnv(pid)+'.glb'
    if not opt.only or pid in opt.only:
        staged=os.path.join(STAGING,filename)
        bpy.ops.export_scene.gltf(filepath=staged,export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_cameras=False,export_lights=False,export_yup=True,export_materials='EXPORT',export_attributes=False)
        for retry in range(20):
            try:os.replace(staged,os.path.join(OUT,filename));break
            except OSError:
                if retry==19:raise
                time.sleep(.15)
    manifest.append({'projectId':pid,'name':title,'asset':'assets/projects/'+filename,'truthState':'FANTASY_WORLD','architectureVersion':3,'artRevision':4,'generator':'Blender','features':[FEATURES[pid][0]],'source':{'file':'src/inventory.ts','projectId':pid,'summary':FEATURES[pid][0]},'triangles':len(mesh.data.polygons),'bounds':gltf_bounds,'materials':1})
    mesh.location=(index%11*6.5,index//11*6.2,0);library.append(mesh)
    print('KARMIC_ASSET',pid,len(mesh.data.polygons),flush=True)

with open(os.path.join(SOURCE,'catalogue.json'),'w',encoding='utf-8') as f:json.dump({'version':3,'artRevision':4,'truthState':'FANTASY_WORLD','artDirection':'Architectural models with radiused edges, smooth formed surfaces, framed glazing, construction details and restrained diffuse materials.','provenance':'Original Blender geometry authored for the user\'s invention inventory. No third-party assets or model APIs.','recipe':'scripts/blender/build_assets.py','generator':'Blender','models':manifest},f,indent=2,ensure_ascii=False)

scene=bpy.context.scene;scene.world.color=(.35,.35,.35)
scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=1800;scene.render.resolution_y=1350;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
bpy.ops.object.camera_add(location=(34,-44,62));camera=bpy.context.object;camera.name='Library overview';camera.rotation_euler=(Vector((32,19,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=77;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(25,10,38));light=bpy.context.object;light.name='Soft studio key';light.data.energy=7000;light.data.shape='DISK';light.data.size=35
bpy.ops.object.light_add(type='SUN',location=(0,0,20));sun=bpy.context.object;sun.rotation_euler=(.45,-.4,-.4);sun.data.energy=1.4;sun.data.angle=.45
world=scene.world;world.use_nodes=True;world.node_tree.nodes.get('Background').inputs[0].default_value=(.70,.80,.85,1);world.node_tree.nodes.get('Background').inputs[1].default_value=.55
bpy.ops.object.select_all(action='DESELECT');library[0].select_set(True);bpy.context.view_layer.objects.active=library[0]
# Source is shared with other agents. Strip workstation browser state and keep
# all scene references self-contained; no user's Documents path belongs here.
for screen_block in bpy.data.screens:
    for area in screen_block.areas:
        for space in area.spaces:
            if space.type=='FILE_BROWSER' and getattr(space,'params',None):
                space.params.directory=b'//'
                if hasattr(space.params,'filename'):space.params.filename=''
scene.render.filepath='//contact-sheet.png'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,'karmic-ideas.blend'),compress=True)
if opt.render:
    scene.render.filepath=os.path.join(SOURCE,'contact-sheet.png');bpy.ops.render.render(write_still=True)
print('KARMIC_COMPLETE',len(manifest),'assets',sum(a['triangles'] for a in manifest),'triangles',flush=True)

