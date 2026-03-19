@namespace
class SpriteKind:
    Guard = SpriteKind.create()
    Terminal = SpriteKind.create()
    UI = SpriteKind.create()

# ---------------- Core tuning ----------------
PLAYER_SPEED = 70
GUARD_SPEED = 34
INTERACT_DISTANCE = 20

HACK_TIME_MS = 2800
FOV_DISTANCE = 58
FOV_ANGLE_DEG = 72
HALF_FOV_COS = Math.cos((FOV_ANGLE_DEG / 2) * Math.PI / 180)

# ---------------- Game state ----------------
guard_patrol_a_x = 28
guard_patrol_a_y = 24
guard_patrol_b_x = 132
guard_patrol_b_y = 94
guard_target_a = False

guard_facing_x = 1
guard_facing_y = 0

is_hacking = False
hack_progress_ms = 0
terminal_hacked = False
caught = False

glitch_y = 0
terminal_blink = False

# ---------------- Scene art ----------------
bg = image.create(screen.width, screen.height)
bg.fill(15)  # dark

# subtle horizontal bands
yy = 0
while yy < screen.height:
    c = 1 if (yy % 6 == 0) else 15
    bg.draw_line(0, yy, screen.width - 1, yy, c)
    yy += 1

# neon frame
bg.draw_rect(3, 3, screen.width - 6, screen.height - 6, 7)
bg.draw_rect(5, 5, screen.width - 10, screen.height - 10, 1)

# little "city lights" dots
i = 0
while i < 90:
    bg.set_pixel(randint(8, screen.width - 9), randint(8, screen.height - 9), 7)
    i += 1

scene.set_background_image(bg)

# ---------------- Sprites ----------------
hero = sprites.create(img("""
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
"""), SpriteKind.player)
hero.set_position(20, 64)
hero.set_stay_in_screen(True)
controller.move_sprite(hero, PLAYER_SPEED, PLAYER_SPEED)

terminal_a = img("""
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
""")
terminal_b = img("""
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
""")
terminal_hacked_img = img("""
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
""")

terminal_node = sprites.create(terminal_a, SpriteKind.Terminal)
terminal_node.set_position(82, 62)

ecorp_guard = sprites.create(img("""
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
"""), SpriteKind.Guard)
ecorp_guard.set_position(guard_patrol_a_x, guard_patrol_a_y)

# ---------------- UI layers ----------------
hack_bar_bg = sprites.create(image.create(56, 10), SpriteKind.UI)
hack_bar_bg.set_flag(SpriteFlag.Ghost, True)
hack_bar_bg.set_flag(SpriteFlag.RelativeToCamera, True)
hack_bar_bg.set_flag(SpriteFlag.Invisible, True)
hack_bar_bg.set_position(screen.width / 2, screen.height - 10)
hack_bar_bg.z = 90

hack_bar_fill = sprites.create(image.create(1, 6), SpriteKind.UI)
hack_bar_fill.set_flag(SpriteFlag.Ghost, True)
hack_bar_fill.set_flag(SpriteFlag.RelativeToCamera, True)
hack_bar_fill.set_flag(SpriteFlag.Invisible, True)
hack_bar_fill.z = 91

fov_overlay = sprites.create(image.create(screen.width, screen.height), SpriteKind.UI)
fov_overlay.set_flag(SpriteFlag.Ghost, True)
fov_overlay.set_flag(SpriteFlag.RelativeToCamera, False)
fov_overlay.z = 30

crt_overlay = sprites.create(image.create(screen.width, screen.height), SpriteKind.UI)
crt_overlay.set_flag(SpriteFlag.Ghost, True)
crt_overlay.set_flag(SpriteFlag.RelativeToCamera, True)
crt_overlay.z = 110

vignette = sprites.create(image.create(screen.width, screen.height), SpriteKind.UI)
vignette.set_flag(SpriteFlag.Ghost, True)
vignette.set_flag(SpriteFlag.RelativeToCamera, True)
vignette.z = 105

# vignette drawing
vg = image.create(screen.width, screen.height)
vg.fill(0)
# dark edge rings
r = 0
while r < 7:
    c = 1 if r < 4 else 15
    vg.draw_rect(r, r, screen.width - r * 2, screen.height - r * 2, c)
    r += 1
vignette.set_image(vg)

def update_hack_bar():
    p = hack_progress_ms / HACK_TIME_MS
    if p < 0:
        p = 0
    if p > 1:
        p = 1

    b = image.create(56, 10)
    b.fill(1)
    b.draw_rect(0, 0, 56, 10, 7)
    b.draw_rect(1, 1, 54, 8, 15)
    hack_bar_bg.set_image(b)

    fw = Math.round(p * 50)
    if fw < 1:
        fw = 1
    if fw > 50:
        fw = 50

    f = image.create(fw, 6)
    f.fill(7)
    hack_bar_fill.set_image(f)
    hack_bar_fill.left = hack_bar_bg.left + 3
    hack_bar_fill.y = hack_bar_bg.y

def set_hacking_state(active):
    global is_hacking, hack_progress_ms
    is_hacking = active
    if active:
        controller.move_sprite(hero, 0, 0)
        hero.vx = 0
        hero.vy = 0
        hack_progress_ms = 0
        update_hack_bar()
        hack_bar_bg.set_flag(SpriteFlag.Invisible, False)
        hack_bar_fill.set_flag(SpriteFlag.Invisible, False)
    else:
        controller.move_sprite(hero, PLAYER_SPEED, PLAYER_SPEED)
        hack_bar_bg.set_flag(SpriteFlag.Invisible, True)
        hack_bar_fill.set_flag(SpriteFlag.Invisible, True)

def move_guard_patrol():
    global guard_target_a, guard_facing_x, guard_facing_y

    if guard_target_a:
        tx = guard_patrol_a_x
        ty = guard_patrol_a_y
    else:
        tx = guard_patrol_b_x
        ty = guard_patrol_b_y

    dx = tx - ecorp_guard.x
    dy = ty - ecorp_guard.y
    ln = Math.sqrt(dx * dx + dy * dy)

    nx = 0
    ny = 0
    if ln > 0.0001:
        nx = dx / ln
        ny = dy / ln

    step = GUARD_SPEED / 60
    ecorp_guard.x += nx * step
    ecorp_guard.y += ny * step

    if Math.abs(nx) > 0.001 or Math.abs(ny) > 0.001:
        guard_facing_x = nx
        guard_facing_y = ny

    rx = tx - ecorp_guard.x
    ry = ty - ecorp_guard.y
    if Math.sqrt(rx * rx + ry * ry) < 2:
        guard_target_a = not guard_target_a

def guard_can_see_hero():
    vx = hero.x - ecorp_guard.x
    vy = hero.y - ecorp_guard.y
    d = Math.sqrt(vx * vx + vy * vy)

    if d > FOV_DISTANCE:
        return False
    if d < 0.0001:
        return True

    px = vx / d
    py = vy / d
    dot = guard_facing_x * px + guard_facing_y * py
    return dot >= HALF_FOV_COS

def redraw_fov():
    cone = image.create(screen.width, screen.height)
    cone.fill(0)

    gx = ecorp_guard.x
    gy = ecorp_guard.y
    ang = Math.atan2(guard_facing_y, guard_facing_x)
    h = (FOV_ANGLE_DEG / 2) * Math.PI / 180

    left_x = gx + Math.cos(ang - h) * FOV_DISTANCE
    left_y = gy + Math.sin(ang - h) * FOV_DISTANCE
    right_x = gx + Math.cos(ang + h) * FOV_DISTANCE
    right_y = gy + Math.sin(ang + h) * FOV_DISTANCE

    # cone outline
    cone.draw_line(gx, gy, left_x, left_y, 3)
    cone.draw_line(gx, gy, right_x, right_y, 3)
    cone.draw_line(left_x, left_y, right_x, right_y, 1)

    # a few inner rays for "flashlight" vibe
    t = 0
    while t <= 6:
        a = (ang - h) + (2 * h) * t / 6
        rx = gx + Math.cos(a) * FOV_DISTANCE
        ry = gy + Math.sin(a) * FOV_DISTANCE
        cone.draw_line(gx, gy, rx, ry, 1)
        t += 1

    fov_overlay.set_image(cone)

def redraw_crt():
    global glitch_y
    o = image.create(screen.width, screen.height)
    o.fill(0)

    # scanlines
    y = 0
    while y < screen.height:
        o.draw_line(0, y, screen.width - 1, y, 1)
        y += 2

    # grain
    i = 0
    while i < 55:
        o.set_pixel(randint(0, screen.width - 1), randint(0, screen.height - 1), 7)
        i += 1

    # moving glitch band
    o.draw_line(0, glitch_y, screen.width - 1, glitch_y, 7)
    if glitch_y + 1 < screen.height:
        o.draw_line(0, glitch_y + 1, screen.width - 1, glitch_y + 1, 1)

    glitch_y += 3
    if glitch_y >= screen.height:
        glitch_y = 0

    crt_overlay.set_image(o)

update_hack_bar()
redraw_fov()
redraw_crt()

def on_update():
    global caught

    if caught:
        return

    if not is_hacking:
        move_guard_patrol()

    # auto-hack when close
    if (not terminal_hacked) and (not is_hacking):
        dx = hero.x - terminal_node.x
        dy = hero.y - terminal_node.y
        if Math.sqrt(dx * dx + dy * dy) <= INTERACT_DISTANCE:
            set_hacking_state(True)

    redraw_fov()

    if guard_can_see_hero():
        caught = True
        scene.camera_shake(4, 300)
        game.over(False, effects.melt)

game.on_update(on_update)

def on_hack_tick():
    global hack_progress_ms, terminal_hacked

    if caught:
        return

    if is_hacking:
        hack_progress_ms += 100
        update_hack_bar()
        if hack_progress_ms >= HACK_TIME_MS:
            terminal_hacked = True
            terminal_node.set_image(terminal_hacked_img)
            set_hacking_state(False)
            scene.camera_shake(2, 150)
            game.splash("ACCESS GRANTED")

game.on_update_interval(100, on_hack_tick)

def on_terminal_blink():
    global terminal_blink
    if terminal_hacked:
        return
    terminal_blink = not terminal_blink
    if terminal_blink:
        terminal_node.set_image(terminal_a)
    else:
        terminal_node.set_image(terminal_b)

game.on_update_interval(180, on_terminal_blink)

def on_crt_tick():
    redraw_crt()

game.on_update_interval(120, on_crt_tick)
