Let's now add a major feature: a full gameplay loop with distinct stages. A gameplay stage is an independent state with its own rules and that can transition into another. Previous features like the drone or canon shooting will become gameplay stages and be self-contained. All stages share the current FPS movement, unless otherwise stated.

Each stage will feature the hands with a unique objects in between that will signal the particular functionality for that stage. The player cycles between the stages in a linear fashion with the `Q` and `E` buttons; additionally each numbered key will directly switch to that stage. Each stage has an action that is triggered with `F` key. 

For mobile devices there will 2 arrow buttons, each aligned with the virtual thumb-sticks, that will be used to cycle the stages in a linear fashion back and forth. Then place a green button between them that will trigger the stage function (similar to the `F` key).

Let's also refactor the Debug UI: it will be composed from a shared section for all stages, and then an individual section that will change for each stage. For the shared one, keep the current Cam Pos and Rot, as well as Hour and Lock Lighting Sections.

Game UI will be explicitly designed per stage (and in some not present).

I will first give you the list of gameplay stages in their declared order, then give individual design for each:
1. Idle 
2. Setup Projectile
3. Adjust Canon
4. Fire Canon
5. Drone View
6. Move To Next Shot

# Idle
Model a simple blockout low-poly drone and place it between the hands.
The stage action will trigger (transition to) Drone View.
Individual Debug UI: bring back the Drone Height and Drone Speeds controls.
There is no Game UI.

# Setup Projectile
Model a sphere projectile and place it between the hands.
No individual stage Debug UI.
The stage action will make appear a Game UI overlay in the center of the screen, with the previous Velocity and Mass controls. Hitting the stage action again will make the Game UI disappear.

# Adjust Canon
Model a simple blockout cog wheel and place it between the hands.
No individual stage Debug UI.
The stage action will make appear a Game UI overlay in the center of the screen, with the previous Rotation and Elevation controls. Hitting the stage action again will make the Game UI disappear.

# Fire Canon
Model a simple firing button box, with a big circular red button on top.
Individual stage Debug UI contains the previous Inner and Outer Recoil controls.
No Game UI.
The stage action will fire the cannon like before.

# Drone View
This is the exactly the same Drone view and functionality like before.
No individual stage Debug UI.
No Game UI.
The stage action will exit Drone View and go back into Idle stage.
This stage has an exception in that is has completely different UI and perspective so it's not possible to cycle thru the stages via the buttons or keys. Hide the arrow buttons.

# Move To Next Shot
This is a placeholder stage for now that will be designed later.
