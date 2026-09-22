"""Render a few close views from the editable library for asset review.

blender --factory-startup --background assets/blender/karmic-ideas.blend
  --python scripts/blender/render_details.py -- --output .karmic/asset-review
"""
import argparse, bpy, os, sys
from mathutils import Vector

parser=argparse.ArgumentParser();parser.add_argument('--output',default='.karmic/asset-review')
options=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
os.makedirs(options.output,exist_ok=True)
scene=bpy.context.scene;scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.camera.location=(6,-8,6)
scene.camera.rotation_euler=(Vector((0,0,1.4))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale=6.7
for light in [o for o in scene.objects if o.type=='LIGHT']:
    if light.data.type=='AREA':light.location=(-3,-4,8);light.data.energy=450;light.data.size=6
assets=[o for o in scene.objects if o.get('projectId')]
for obj in assets:obj.hide_render=True
for project_id in ['webroker','windpanel','rudraksha','bio-bottle','robotics-core','cooling-stack']:
    obj=next(o for o in assets if o['projectId']==project_id);position=obj.location.copy();obj.location=(0,0,0);obj.hide_render=False
    scene.render.filepath=os.path.join(os.path.abspath(options.output),project_id+'.png');bpy.ops.render.render(write_still=True)
    obj.location=position;obj.hide_render=True
