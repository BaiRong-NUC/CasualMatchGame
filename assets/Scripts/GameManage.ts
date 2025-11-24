import { _decorator, Button, Component, instantiate, Node, ParticleAsset, ParticleSystem, sp, Sprite, SpriteFrame, Tween, tween, UIOpacity, UITransform, v2, v3 } from 'cc';
import { Block } from './Block';
import { People } from './People';
import { ParticleManage, ParticleNode } from './ParticleManage';
import { ErrorManage } from './ErrorManage';
import super_html_playable from './super_html_playable';
const { ccclass, property } = _decorator;
export enum BlockType {
    WINDOW = 0,
    CARPWT = 1
}
@ccclass('GameManage')
export class GameManage extends Component {
    public static instance: GameManage = null;
    @property(Button)
    startButton: Button[] = [];
    @property(Node)
    helpNode: Node = null;
    helpNodeTween: Tween<Node> = null;
    selectLevel: number = 0;
    @property(Node)
    levelsNode: Node = null;
    levels: Node[] = [];
    @property(Node)
    windowNode: Node = null;
    windowSkeleton: sp.Skeleton = null;
    @property(Node)
    winNodes: Node[] = [];
    @property(People)
    people: People = null;
    isGameEnd: boolean = false;
    isWin: boolean = false;
    targetBlockId: number = null;
    @property(ParticleManage)
    particleManage: ParticleManage = null;
    @property(ParticleAsset)
    rainParticle: ParticleAsset = null;
    // @property(ParticleAsset)
    // earseParticle: ParticleAsset = null;
    @property(Node)
    eraseParticle: Node = null;
    eraseParticles: Node[] = [];
    rainNode: ParticleNode = null;
    @property(Node)
    carpteNode: Node = null;
    isinitBlock: boolean = true;
    @property(SpriteFrame)
    errorSpritFrame: SpriteFrame = null;
    @property(ErrorManage)
    errorManage: ErrorManage = null;
    isShowEnd: boolean = false;
    @property(Node)
    failNode: Node = null;
    @property(Node)
    gameEnd: Node = null;
    @property(Button)
    winButton: Button = null;
    @property(Node)
    download: Node = null;
    @property(Number)
    helpTimeLevel1: number = 0;//第一关提示时间间隔
    @property(Number)
    helpTimeLevel2: number = 0;//第二关提示时间间隔
    curTime: number = 0;
    beginCoutTime: boolean = true;
    firstTouch: boolean = true;
    @property({ type: SpriteFrame, tooltip: "关卡1,点击不同的块时生成的图片" })
    level1Window: SpriteFrame[] = [];
    @property({ type: SpriteFrame, tooltip: "关卡1,点击地毯时生成的随机图片" })
    level1Carpet: SpriteFrame[] = [];
    @property({ type: SpriteFrame, tooltip: "关卡2,点击窗户时生成随机图片" })
    level2Window: SpriteFrame[] = [];
    @property({ type: SpriteFrame, tooltip: "关卡2,点击地毯时生成的随机图片" })
    level2Carpet: SpriteFrame[] = [];
    blockSpritFrames: SpriteFrame[][] = [[], []];
    @property(Node)
    errorBoardNode: Node = null;
    @property(Node)
    rainNodeParent: Node = null;
    /**
     * level1:
     * a 0 a
     * 0 a 0
     */
    /**
     * level2:
     *  a 1 1
     *   b b
     * 1     a
     *   c b 
     *  c c a 
     */
    start() {
        GameManage.instance = this;
        //初始化关卡
        this.levelsNode.children.forEach((level) => {
            if (level.name.startsWith("Level")) {
                this.levels.push(level);
            }
        })
        this.windowSkeleton = this.windowNode.getComponent(sp.Skeleton);
        //初始化粒子
        this.particleManage.constructByParticleAsset("rainParticle", this.rainParticle, 1, this.particleManage.node, true);
        this.rainNode = this.particleManage.playParticle("rainParticle", this.rainNodeParent, v3(0, 0, 0), true);
        // this.particleManage.constructByParticleAsset("eraseParticle", this.earseParticle, 10, this.particleManage.node, true);
        //初始化错误节点
        this.errorManage.constructByErrorPicture(this.errorSpritFrame, 10, this.errorManage.node, true, v2(250, 250));

        this.failNode.scale = v3(0, 0);
        this.gameEnd.getComponent(UIOpacity).opacity = 0;
        this.winButton.node.scale = v3(0, 0, 0);

        // const google_play = "https://play.google.com/store/apps/details?id=tile.rescue.story.match.puzzle";
        //第二个游戏
        const google_play = "https://play.google.com/store/apps/details?id=com.relax.tile.story";

        super_html_playable.set_google_play_url(google_play);
        if (super_html_playable.is_hide_download()) {
            this.download.active = false;
        }
    }
    constructParticle() {
        for (let i = 0; i < 3; i++) {
            //初始化三个爆炸粒子用于消除
            // console.log(this.deepCloneNode(this.eraseParticle));
            this.eraseParticles.push(this.deepCloneNode(this.eraseParticle));
        }
    }
    deepCloneNode(original: Node): Node {
        const clone = instantiate(original);
        // 复制所有子节点
        original.children.forEach(child => {
            const childClone = this.deepCloneNode(child);
            childClone.parent = clone;
        });
        return clone;
    }
    initLevel(levelId: number, blockId: number) {
        let levelBlocksSpritFrames: number[][] = [
            [],
            [0, blockId, blockId, blockId, 0, 2, 2, 0, 1, 1, 2, 1],//level2
        ]
        if (levelId == 0) {
            //第一关
            if (blockId == BlockType.WINDOW) {
                this.blockSpritFrames[levelId] = this.level1Window;
                levelBlocksSpritFrames[levelId] = [1, blockId, 1, blockId, 1, blockId];
            } else if (blockId == BlockType.CARPWT) {
                this.blockSpritFrames[levelId] = this.level1Carpet;
                levelBlocksSpritFrames[levelId] = [0, blockId, 0, blockId, 0, blockId];
            }
        } else {
            //第二关
            if (blockId == BlockType.WINDOW) {
                this.blockSpritFrames[levelId] = this.level2Window;
                levelBlocksSpritFrames[levelId] = [1, 0, 0, 0, 1, 2, 2, 1, 3, 3, 2, 3];
            } else if (blockId == BlockType.CARPWT) {
                this.blockSpritFrames[levelId] = this.level2Carpet;
                levelBlocksSpritFrames[levelId] = [0, 1, 1, 1, 0, 2, 2, 0, 3, 3, 2, 3];
            }
        }
        let level = this.levels[levelId].getChildByName("Blocks");
        if (level.children.length != levelBlocksSpritFrames[levelId].length) {
            console.error("关卡" + levelId + "的按钮数量和关卡" + levelId + "的按钮数量不匹配");
            console.error("关卡" + levelId + "的按钮数量为" + level.children.length + "，生成" + levelId + "的按钮数量为" + levelBlocksSpritFrames[levelId].length);
            return;
        }
        for (let i = 0; i < level.children.length; i++) {
            level.children[i].getComponent(Sprite).spriteFrame = this.blockSpritFrames[levelId][levelBlocksSpritFrames[levelId][i]];
            level.children[i].getComponent(Block).blockId = levelBlocksSpritFrames[levelId][i];
        }

    }

    onDownLoad() {
        super_html_playable.game_end();
        super_html_playable.download();
    }

    onTouchStartButton(bolckId: number) {
        //用户在游戏中,窗户的动画改变
        this.windowSkeleton.setAnimation(0, 'donghua1', true);
        this.targetBlockId = bolckId;
        //激活对应等级的关卡
        this.levels[this.selectLevel].active = true;
        tween(this.levels[this.selectLevel].getComponent(UIOpacity))
            .to(0.6, { opacity: 255 }, { easing: 'backOut' })
            .start();
    }

    showEnd(isWin: boolean) {
        this.beginCoutTime = false;
        if (this.isWin == false) {
            console.log("游戏失败");
            this.failNode.active = true;
            tween(this.failNode)
                .to(0.5, { scale: v3(1, 1, 1) }, { easing: "backOut" })
                .delay(0.3)
                .to(0.5, { scale: v3(0, 0, 0) }, { easing: "backIn" })
                .call(() => {
                    this.gameEnd.active = true;
                    tween(this.gameEnd.getComponent(UIOpacity))
                        .to(1, { opacity: 255 }, { easing: "backOut" })
                        .start();
                })
                .start();

        } else {
            console.log("游戏胜利");
            //最后的诱导下载按钮激活
            this.winButton.node.active = true;
            this.curTime = 0;
            this.helpTimeLevel2 = 100;
            tween(this.winButton.node)
                .to(0.5, { scale: v3(0.7, 0.7, 0.7) }, { easing: 'backOut' })
                .call(() => {
                    let hand = GameManage.instance.helpNode;
                    hand.setParent(this.winButton.node);
                    hand.setPosition(v3(0, 0, 0));
                    hand.scale = v3(0, 0, 0);
                    hand.active = true;
                    this.helpNodeTween = tween(hand)
                        .to(0.3, { scale: v3(1.7, 1.7, 1.7) }, { easing: 'backOut' })
                        .start();
                })
                .start();
        }
    }

    onDebug() {
        // this.isGameEnd = true;
        // this.isWin = true;
        this.showHelp();
    }

    onTouchWinButton() {
        // console.log("展示最后的下载界面");
        this.helpNode.active = false;
        this.winButton.node.active = false;
        this.gameEnd.active = true;
        tween(this.gameEnd.getComponent(UIOpacity))
            .to(1, { opacity: 255 }, { easing: "backOut" })
            .start();
    }

    getBlockId(): number {
        let ret: number = -1;
        //查找当前level下还有多少Block
        if (this.levels[this.selectLevel].active == true) {
            let targetblocks = this.levels[this.selectLevel].getChildByName("Board");
            //查找当前board下有效block
            let id = -1;
            for (let i = 0; i < targetblocks.children.length; i++) {
                // console.log(`targetblocks.children[${i}].scale.x`, targetblocks.children[i].scale.x);
                // console.log(`targetblocks.children[${i}].scale.y`, targetblocks.children[i].scale.y);
                if (targetblocks.children[i].scale.x == 1 && targetblocks.children[i].scale.y == 1) {
                    return targetblocks.children[i].getComponent(Block).blockId;
                }
            }
            return -1;
        }
        console.error("没有找到有效block");
        return null;
    }

    showHelp() {
        if (this.helpNode.active == false) {
            //查找当前level下还有多少Block
            if (this.levels[this.selectLevel].active == true) {
                let blocks = this.levels[this.selectLevel].getChildByName("Blocks");
                if (blocks.children.length == 0) {
                    console.log("level块为空");
                    return;
                }
                let targetblocks = this.levels[this.selectLevel].getChildByName("Board");
                let targetId = null;
                //查找当前level board下还有多少有效block
                let length = 0;
                let id = -1;
                for (let i = 0; i < targetblocks.children.length; i++) {
                    if ((targetblocks.children[i].scale.x != 0 && targetblocks.children[i].scale.x != 10) || (targetblocks.children[i].scale.y != 0 && targetblocks.children[i].scale.y != 10)) {
                        length++;
                        if (id == -1) {
                            id = targetblocks.children[i].getComponent(Block).blockId;
                        } else {
                            if (id != targetblocks.children[i].getComponent(Block).blockId) {
                                console.log("板子上块不一致")
                                return;
                            }
                        }
                    }
                }
                if (length == 0) {
                    //可以任意点击
                    targetId = -1;
                } else {
                    let block = targetblocks.children[targetblocks.children.length - 1].getComponent(Block);
                    if (block == null) {
                        targetId = -1;
                    } else {
                        targetId = block.blockId;
                    }
                }

                for (let i = 0; i < blocks.children.length; i++) {
                    let block = blocks.children[i].getComponent(Block);
                    if (block.blockLayer.length == 0 && (targetId == -1 || block.blockId == targetId)) {

                        //可以点击的位置
                        let hand = GameManage.instance.helpNode;
                        hand.setParent(block.level);
                        let position = block.node.getComponent(UITransform).convertToWorldSpaceAR(v3(0, 0, 0));
                        position = block.level.getComponent(UITransform).convertToNodeSpaceAR(position);
                        hand.setPosition(position);
                        hand.scale = v3(0, 0, 0);
                        hand.active = true;
                        this.helpNodeTween = tween(hand)
                            .to(0.3, { scale: v3(1.3, 1.3, 1.3) }, { easing: 'backOut' })
                            .start();
                    }
                }
            }
        }
    }

    update(deltaTime: number) {
        if (this.isShowEnd == true) { return; }
        if (this.isGameEnd == true) {
            //游戏结束
            this.isShowEnd = true;
            this.showEnd(this.isWin);
        }
        if (this.beginCoutTime == true) {
            if (this.firstTouch == true) {
                this.showHelp();
            } else {
                this.curTime += deltaTime;
                let time = this.selectLevel == 0 ? this.helpTimeLevel1 : this.helpTimeLevel2;
                if (this.curTime >= time && this.helpNode.active == false) {
                    this.curTime = 0;
                    this.showHelp();
                }
            }
        } else {
            this.curTime = 0;
        }
    }
}


