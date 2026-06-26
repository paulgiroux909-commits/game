// Princess Donut: Carl's companion. She auto-attacks and has her own health pool.
export class Donut {
  constructor(player) {
    this.player = player;
    this.x = 0; this.y = 0;
    this.atkCd = 0;
    this.downed = false;
    this.reviveTimer = 0;
    this.recompute();
    this.hp = this.maxHp;
  }
  recompute() {
    const p = this.player;
    this.maxHp = Math.round(40 + p.attr.charisma * 8 + p.level * 5);
    if (this.hp != null) this.hp = Math.min(this.hp, this.maxHp);
  }
}
