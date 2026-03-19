let c: number;
namespace SpriteKind {
    export const Guard = SpriteKind.create()
    export const Terminal = SpriteKind.create()
    export const UI = SpriteKind.create()
}

//  ---------------- Core tuning ----------------
let PLAYER_SPEED = 70
let GUARD_SPEED = 34
let INTERACT_DISTANCE = 20
let HACK_TIME_MS = 2800
let FOV_DISTANCE = 58
let FOV_ANGLE_DEG = 72
let HALF_FOV_COS = Math.cos(FOV_ANGLE_DEG / 2 * Math.PI / 180)
//  ---------------- Game state ----------------
let guard_patrol_a_x = 28
let guard_patrol_a_y = 24
let guard_patrol_b_x = 132
let guard_patrol_b_y = 94
let guard_target_a = false
let guard_facing_x = 1
let guard_facing_y = 0
let is_hacking = false
let hack_progress_ms = 0
let terminal_hacked = false
let caught = false
let glitch_y = 0
let terminal_blink = false
//  ---------------- Scene art ----------------
let bg = image.create(screen.width, screen.height)
bg.fill(15)
//  dark
//  subtle horizontal bands
let yy = 0
while (yy < screen.height) {
    c = yy % 6 == 0 ? 1 : 15
    bg.drawLine(0, yy, screen.width - 1, yy, c)
    yy += 1
}
//  neon frame
bg.drawRect(3, 3, screen.width - 6, screen.height - 6, 7)
bg.drawRect(5, 5, screen.width - 10, screen.height - 10, 1)
//  little "city lights" dots
let i = 0
while (i < 90) {
    bg.setPixel(randint(8, screen.width - 9), randint(8, screen.height - 9), 7)
    i += 1
}
scene.setBackgroundImage(bg)
//  ---------------- Sprites ----------------
let hero = sprites.create(img`
    . . . 7 7 7 7 . . .
    . . 7 7 7 7 7 7 . .
    . 7 7 5 7 7 5 7 7 .
    . 7 7 7 7 7 7 7 7 .
    . 7 7 7 7 7 7 7 7 .
    . 7 1 1 7 7 1 1 7 .
    . 7 1 1 7 7 1 1 7 .
    . . 7 7 7 7 7 7 . .
    . . . 7 7 7 7 . . .
    . . . . 7 7 . . . .
`, SpriteKind.Player)
hero.setPosition(20, 64)
hero.setStayInScreen(true)
controller.moveSprite(hero, PLAYER_SPEED, PLAYER_SPEED)
let terminal_a = img`
    . 7 7 7 7 7 7 7 7 .
    7 1 1 1 1 1 1 1 1 7
    7 1 7 7 7 7 7 7 1 7
    7 1 7 1 1 1 1 7 1 7
    7 1 7 1 7 7 1 7 1 7
    7 1 7 1 1 1 1 7 1 7
    7 1 7 7 7 7 7 7 1 7
    7 1 1 1 1 1 1 1 1 7
    . 7 7 7 7 7 7 7 7 .
    . . 7 7 . . 7 7 . .
`
let terminal_b = img`
    . 7 7 7 7 7 7 7 7 .
    7 1 1 1 1 1 1 1 1 7
    7 1 7 7 7 7 7 7 1 7
    7 1 7 7 1 1 7 7 1 7
    7 1 7 1 7 7 1 7 1 7
    7 1 7 7 1 1 7 7 1 7
    7 1 7 7 7 7 7 7 1 7
    7 1 1 1 1 1 1 1 1 7
    . 7 7 7 7 7 7 7 7 .
    . . 7 7 . . 7 7 . .
`
let terminal_hacked_img = img`
    . 7 7 7 7 7 7 7 7 .
    7 7 7 7 7 7 7 7 7 7
    7 7 1 1 1 1 1 1 7 7
    7 7 1 7 7 7 7 1 7 7
    7 7 1 7 1 1 7 1 7 7
    7 7 1 7 7 7 7 1 7 7
    7 7 1 1 1 1 1 1 7 7
    7 7 7 7 7 7 7 7 7 7
    . 7 7 7 7 7 7 7 7 .
    . . 7 7 . . 7 7 . .
`
let terminal_node = sprites.create(terminal_a, SpriteKind.Terminal)
terminal_node.setPosition(82, 62)
let ecorp_guard = sprites.create(img`
    . . 3 3 3 3 3 3 . .
    . 3 3 3 3 3 3 3 3 .
    3 3 3 8 3 3 8 3 3 3
    3 3 3 3 3 3 3 3 3 3
    3 3 2 2 3 3 2 2 3 3
    3 3 2 2 3 3 2 2 3 3
    . 3 3 3 3 3 3 3 3 .
    . . 3 3 3 3 3 3 . .
    . . . 3 3 3 3 . . .
    . . . . 3 3 . . . .
`, SpriteKind.Guard)
ecorp_guard.setPosition(guard_patrol_a_x, guard_patrol_a_y)
//  ---------------- UI layers ----------------
let hack_bar_bg = sprites.create(image.create(56, 10), SpriteKind.UI)
hack_bar_bg.setFlag(SpriteFlag.Ghost, true)
hack_bar_bg.setFlag(SpriteFlag.RelativeToCamera, true)
hack_bar_bg.setFlag(SpriteFlag.Invisible, true)
hack_bar_bg.setPosition(screen.width / 2, screen.height - 10)
hack_bar_bg.z = 90
let hack_bar_fill = sprites.create(image.create(1, 6), SpriteKind.UI)
hack_bar_fill.setFlag(SpriteFlag.Ghost, true)
hack_bar_fill.setFlag(SpriteFlag.RelativeToCamera, true)
hack_bar_fill.setFlag(SpriteFlag.Invisible, true)
hack_bar_fill.z = 91
let fov_overlay = sprites.create(image.create(screen.width, screen.height), SpriteKind.UI)
fov_overlay.setFlag(SpriteFlag.Ghost, true)
fov_overlay.setFlag(SpriteFlag.RelativeToCamera, false)
fov_overlay.z = 30
let crt_overlay = sprites.create(image.create(screen.width, screen.height), SpriteKind.UI)
crt_overlay.setFlag(SpriteFlag.Ghost, true)
crt_overlay.setFlag(SpriteFlag.RelativeToCamera, true)
crt_overlay.z = 110
let vignette = sprites.create(image.create(screen.width, screen.height), SpriteKind.UI)
vignette.setFlag(SpriteFlag.Ghost, true)
vignette.setFlag(SpriteFlag.RelativeToCamera, true)
vignette.z = 105
//  vignette drawing
let vg = image.create(screen.width, screen.height)
vg.fill(0)
//  dark edge rings
let r = 0
while (r < 7) {
    c = r < 4 ? 1 : 15
    vg.drawRect(r, r, screen.width - r * 2, screen.height - r * 2, c)
    r += 1
}
vignette.setImage(vg)
function update_hack_bar() {
    let p = hack_progress_ms / HACK_TIME_MS
    if (p < 0) {
        p = 0
    }
    
    if (p > 1) {
        p = 1
    }
    
    let b = image.create(56, 10)
    b.fill(1)
    b.drawRect(0, 0, 56, 10, 7)
    b.drawRect(1, 1, 54, 8, 15)
    hack_bar_bg.setImage(b)
    let fw = Math.round(p * 50)
    if (fw < 1) {
        fw = 1
    }
    
    if (fw > 50) {
        fw = 50
    }
    
    let f = image.create(fw, 6)
    f.fill(7)
    hack_bar_fill.setImage(f)
    hack_bar_fill.left = hack_bar_bg.left + 3
    hack_bar_fill.y = hack_bar_bg.y
}

function set_hacking_state(active: boolean) {
    
    is_hacking = active
    if (active) {
        controller.moveSprite(hero, 0, 0)
        hero.vx = 0
        hero.vy = 0
        hack_progress_ms = 0
        update_hack_bar()
        hack_bar_bg.setFlag(SpriteFlag.Invisible, false)
        hack_bar_fill.setFlag(SpriteFlag.Invisible, false)
    } else {
        controller.moveSprite(hero, PLAYER_SPEED, PLAYER_SPEED)
        hack_bar_bg.setFlag(SpriteFlag.Invisible, true)
        hack_bar_fill.setFlag(SpriteFlag.Invisible, true)
    }
    
}

function move_guard_patrol() {
    let tx: number;
    let ty: number;
    
    if (guard_target_a) {
        tx = guard_patrol_a_x
        ty = guard_patrol_a_y
    } else {
        tx = guard_patrol_b_x
        ty = guard_patrol_b_y
    }
    
    let dx = tx - ecorp_guard.x
    let dy = ty - ecorp_guard.y
    let ln = Math.sqrt(dx * dx + dy * dy)
    let nx = 0
    let ny = 0
    if (ln > 0.0001) {
        nx = dx / ln
        ny = dy / ln
    }
    
    let step = GUARD_SPEED / 60
    ecorp_guard.x += nx * step
    ecorp_guard.y += ny * step
    if (Math.abs(nx) > 0.001 || Math.abs(ny) > 0.001) {
        guard_facing_x = nx
        guard_facing_y = ny
    }
    
    let rx = tx - ecorp_guard.x
    let ry = ty - ecorp_guard.y
    if (Math.sqrt(rx * rx + ry * ry) < 2) {
        guard_target_a = !guard_target_a
    }
    
}

function guard_can_see_hero(): boolean {
    let vx = hero.x - ecorp_guard.x
    let vy = hero.y - ecorp_guard.y
    let d = Math.sqrt(vx * vx + vy * vy)
    if (d > FOV_DISTANCE) {
        return false
    }
    
    if (d < 0.0001) {
        return true
    }
    
    let px = vx / d
    let py = vy / d
    let dot = guard_facing_x * px + guard_facing_y * py
    return dot >= HALF_FOV_COS
}

function redraw_fov() {
    let a: number;
    let rx: number;
    let ry: number;
    let cone = image.create(screen.width, screen.height)
    cone.fill(0)
    let gx = ecorp_guard.x
    let gy = ecorp_guard.y
    let ang = Math.atan2(guard_facing_y, guard_facing_x)
    let h = FOV_ANGLE_DEG / 2 * Math.PI / 180
    let left_x = gx + Math.cos(ang - h) * FOV_DISTANCE
    let left_y = gy + Math.sin(ang - h) * FOV_DISTANCE
    let right_x = gx + Math.cos(ang + h) * FOV_DISTANCE
    let right_y = gy + Math.sin(ang + h) * FOV_DISTANCE
    //  cone outline
    cone.drawLine(gx, gy, left_x, left_y, 3)
    cone.drawLine(gx, gy, right_x, right_y, 3)
    cone.drawLine(left_x, left_y, right_x, right_y, 1)
    //  a few inner rays for "flashlight" vibe
    let t = 0
    while (t <= 6) {
        a = ang - h + 2 * h * t / 6
        rx = gx + Math.cos(a) * FOV_DISTANCE
        ry = gy + Math.sin(a) * FOV_DISTANCE
        cone.drawLine(gx, gy, rx, ry, 1)
        t += 1
    }
    fov_overlay.setImage(cone)
}

function redraw_crt() {
    
    let o = image.create(screen.width, screen.height)
    o.fill(0)
    //  scanlines
    let y = 0
    while (y < screen.height) {
        o.drawLine(0, y, screen.width - 1, y, 1)
        y += 2
    }
    //  grain
    let i = 0
    while (i < 55) {
        o.setPixel(randint(0, screen.width - 1), randint(0, screen.height - 1), 7)
        i += 1
    }
    //  moving glitch band
    o.drawLine(0, glitch_y, screen.width - 1, glitch_y, 7)
    if (glitch_y + 1 < screen.height) {
        o.drawLine(0, glitch_y + 1, screen.width - 1, glitch_y + 1, 1)
    }
    
    glitch_y += 3
    if (glitch_y >= screen.height) {
        glitch_y = 0
    }
    
    crt_overlay.setImage(o)
}

update_hack_bar()
redraw_fov()
redraw_crt()
game.onUpdate(function on_update() {
    let dx: number;
    let dy: number;
    
    if (caught) {
        return
    }
    
    if (!is_hacking) {
        move_guard_patrol()
    }
    
    //  auto-hack when close
    if (!terminal_hacked && !is_hacking) {
        dx = hero.x - terminal_node.x
        dy = hero.y - terminal_node.y
        if (Math.sqrt(dx * dx + dy * dy) <= INTERACT_DISTANCE) {
            set_hacking_state(true)
        }
        
    }
    
    redraw_fov()
    if (guard_can_see_hero()) {
        caught = true
        scene.cameraShake(4, 300)
        game.over(false, effects.melt)
    }
    
})
game.onUpdateInterval(100, function on_hack_tick() {
    
    if (caught) {
        return
    }
    
    if (is_hacking) {
        hack_progress_ms += 100
        update_hack_bar()
        if (hack_progress_ms >= HACK_TIME_MS) {
            terminal_hacked = true
            terminal_node.setImage(terminal_hacked_img)
            set_hacking_state(false)
            scene.cameraShake(2, 150)
            game.splash("ACCESS GRANTED")
        }
        
    }
    
})
game.onUpdateInterval(180, function on_terminal_blink() {
    
    if (terminal_hacked) {
        return
    }
    
    terminal_blink = !terminal_blink
    if (terminal_blink) {
        terminal_node.setImage(terminal_a)
    } else {
        terminal_node.setImage(terminal_b)
    }
    
})
game.onUpdateInterval(120, function on_crt_tick() {
    redraw_crt()
})
