# Cadenza!!
A WebVR rhythm game

## Beatmap format

```javascript
{
    "song":"",
    "songFile":"no_title.ogg",
    "difficulty":0,
    "artist":"",
    "mapper":"",
    "image":"",
    "skysphere": {
        "texture": "background.jpg",
        "vertexShader": "skyVertex.glsl",
        "fragmentShader": "skyFragment.glsl",
    }
    "models":[
        {
            "file": "model.gltf",
            "position": [0, 0, 0], // x, y, z
            "rotation": [0, 0, 0, 1], // x, y, z, w
            "scale": [1, 1, 1], //x, y, z
            "vertexShader": "vertexShader.glsl",
            "fragmentShader": "fragmentShader.glsl"
        }
    ]
    "sections":[
        {
            "bpm": 60,
            "duration": 100, //seconds
            "notes": [
                [
                    0,    //note type (0 - hit note, 1 - slide note, 2 - hold note, 3 - drumroll note)
                    1,    //note position (0 is leftmost key)
                    1000, //note start time in ms
                    2     //note width
                          //note end time in ms if hold note or drumroll note
                ]
            ]
        }
    ]
}
```
