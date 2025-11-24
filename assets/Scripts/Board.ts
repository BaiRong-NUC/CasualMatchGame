import { _decorator, Component, Node, Vec3, v3, tween, UIOpacity, UITransform, ParticleSystem, BoxCollider2D } from 'cc';
import { BlockType, GameManage } from './GameManage';
import { Block } from './Block';
import { StartButton } from './StartButton';
import { PeopleState, PeopleStateName } from './People';
const { ccclass, property } = _decorator;

@ccclass('Board')
export class Board extends Component {
    blardNumber: number = 0;
    pos: Vec3[] = [v3(-263, 7, 0), v3(0, 7, 0), v3(259, 7, 0)];
    canTouch: boolean = true;
    block: Node[] = [];
    level: Node = null;
    start() {
        this.level = this.node.parent;
    }
    addBoard(blockNode: Node) {
        if (this.canTouch == false || this.blardNumber >= 3) {
            console.log("board已满或board正在清除中,无法添加方块");
            //播放错误
            let position = blockNode.getComponent(UITransform).convertToWorldSpaceAR(v3(0, 0, 0));
            position = this.level.getComponent(UITransform).convertToNodeSpaceAR(position);
            GameManage.instance.errorManage.playError(this.level, blockNode, position, true);
            return;
        }
        GameManage.instance.curTime = 0
        let position = this.pos[this.blardNumber];
        this.blardNumber++;
        // console.log("board添加方块" + this.blardNumber);
        blockNode.setParent(this.node, true);
        blockNode.getComponent(Block).isplaying = true;
        tween(blockNode)
            .to(0.15, { position: position }, { easing: "sineInOut" })
            .call(() => {
                //关闭碰撞
                let colider = blockNode.getComponent(BoxCollider2D);
                if (colider != null) {
                    colider.enabled = false;
                }
                this.block.push(blockNode);
                if (this.block.length == 3) {
                    this.clearBoard();
                }
            })
            .start();
    }

    reShow() {
        //激活button
        let allDown: boolean = true;
        for (let i = 0; i < GameManage.instance.startButton.length; i++) {
            GameManage.instance.startButton[i].node.getComponent(StartButton).isInit = false;
            allDown = false;
        }
        if (allDown == true) {
            //全部点击完毕
            GameManage.instance.isGameEnd = true;
            GameManage.instance.isWin = true;
        }
    }

    clearBoard() {
        // console.log("当前还有" + level.children.length + "个方块");
        this.canTouch = false;
        //判断三个boardID是否相同
        const blockIds = this.block.map(block => block.getComponent(Block).blockId);
        const allSame = blockIds.every(id => id === blockIds[0]);
        if (allSame == false) {
            console.log("三个方块ID不同,无法清除,将block回归原位");
            //播放错误
            let errorBoardNode = GameManage.instance.errorBoardNode;
            errorBoardNode.scale = v3(0, 0, 0);
            errorBoardNode.active = true;
            errorBoardNode.setParent(this.level, true);
            let position = this.node.getComponent(UITransform).convertToWorldSpaceAR(v3(0, 0, 0));
            position = this.level.getComponent(UITransform).convertToNodeSpaceAR(position);
            errorBoardNode.setPosition(position);
            GameManage.instance.isinitBlock = true;
            tween(errorBoardNode)
                .to(0.3, { scale: v3(1, 1, 1) }, { easing: "backOut" })
                .to(0.3, { scale: v3(0, 0, 0) }, { easing: "backIn" })
                .delay(0.15)
                .call(() => {
                    let blocks = [];
                    for (let i = 0; i < this.block.length; i++) {
                        let block = this.block[i].getComponent(Block);
                        if (blocks.length == 0) {
                            blocks.push(this.block[i]);
                        } else {
                            //插入到blocks上使得blocks的childPos从小到大排序
                            let pos = 0;
                            while (pos < blocks.length && block.childPos > blocks[pos].getComponent(Block).childPos) {
                                pos++;
                            }
                            if (pos == blocks.length) {
                                blocks.push(this.block[i]);
                            } else {
                                blocks.splice(pos, 0, this.block[i]);
                            }
                        }
                    }
                    // console.log("blocks:" + blocks.length);
                    for (let i = 0; i < blocks.length; i++) {
                        let block = blocks[i];
                        block.setParent(this.level.getChildByName("Blocks"), true);
                        // console.log("block的childPos:" + block.getComponent(Block).childPos);
                        block.setSiblingIndex(block.getComponent(Block).childPos);
                        if (i != this.block.length - 1) {
                            tween(block)
                                .to(0.2, { position: block.getComponent(Block).prevPos }, { easing: "sineInOut" })
                                .call(() => {
                                    //恢复碰撞
                                    let colider = block.getComponent(BoxCollider2D);
                                    if (colider != null) {
                                        colider.enabled = true;
                                    }
                                    block.getComponent(Block).isplaying = false;
                                })
                                .start();
                        } else {
                            tween(block)
                                .to(0.2, { position: block.getComponent(Block).prevPos }, { easing: "sineInOut" })
                                .call(() => {
                                    //恢复碰撞
                                    let colider = block.getComponent(BoxCollider2D);
                                    if (colider != null) {
                                        colider.enabled = true;
                                    }
                                    block.getComponent(Block).isplaying = false;
                                    this.block = [];
                                    this.blardNumber = 0;
                                    this.canTouch = true;
                                })
                                .start();
                        }
                    }
                })
                .start();

            // tween(this.level.getComponent(UIOpacity))
            //     .to(0.3, { opacity: 0 }, { easing: "backIn" })
            //     .call(() => {
            //         this.level.active = false;
            //         GameManage.instance.isGameEnd = true;
            //         GameManage.instance.isWin = false;
            //     })
            //     .start();
            return;
        }
        //清除board,剩余一个用来判断是否进入下一关
        for (let i = 0; i < this.block.length; i++) {
            //播放删除粒子
            let position = this.block[i].getComponent(UITransform).convertToWorldSpaceAR(v3(0, 0, 0));
            position = this.node.getComponent(UITransform).convertToNodeSpaceAR(position);
            // GameManage.instance.particleManage.playParticle("eraseParticle", this.node, position, true);
            if (GameManage.instance.eraseParticles.length == 0) {
                GameManage.instance.constructParticle();
            }
            let boom = GameManage.instance.eraseParticles[i];
            boom.setParent(this.node, true);
            boom.setPosition(position);
            boom.active = true;
            boom.children[0].children.forEach((particle) => {
                particle.active = true;
                particle.getComponent(ParticleSystem).stop();
                particle.getComponent(ParticleSystem).play();
            })
            if (i != this.block.length - 1) {
                tween(this.block[i])
                    .to(0.4, { scale: v3(0, 0, 0) }, { easing: "backIn" })
                    .start();
            } else {
                console.log("最后一个方块删除");
                GameManage.instance.eraseParticles = [];
                tween(this.block[i])
                    .to(0.4, { scale: v3(0, 0, 0) }, { easing: "backIn" })
                    .call(() => {
                        //获取当前还有多少个方块
                        let level = GameManage.instance.levels[GameManage.instance.selectLevel].getChildByName("Blocks");
                        if (level.children.length == 0) {
                            //这关结束了
                            console.log("第" + GameManage.instance.selectLevel + "关结束了");
                            tween(GameManage.instance.levels[GameManage.instance.selectLevel].getComponent(UIOpacity))
                                .to(0.15, { opacity: 0 }, { easing: "backIn" })
                                .call(() => {
                                    //播放替换图片的动画
                                    if (GameManage.instance.targetBlockId == BlockType.WINDOW) {
                                        //点击的是窗户
                                        //人物微笑
                                        GameManage.instance.people.playAnimation(PeopleStateName[PeopleState.HAPPY], 4);
                                        //停止下雨
                                        GameManage.instance.rainNode.particleNode.active = false;
                                        GameManage.instance.rainNode = null;
                                        //替换窗户
                                        tween(GameManage.instance.windowNode)
                                            .to(0.5, { scale: v3(0, 0, 0) }, { easing: "backIn" })
                                            .call(() => {
                                                GameManage.instance.windowNode.active = false;
                                                //激活新的窗户
                                                let newWindowNode = GameManage.instance.winNodes[GameManage.instance.targetBlockId];
                                                newWindowNode.scale = v3(0, 0, 0);
                                                newWindowNode.active = true;
                                                tween(newWindowNode)
                                                    .to(0.5, { scale: v3(1, 1, 1) }, { easing: "backOut" })
                                                    .call(() => {
                                                        this.reShow();
                                                    })
                                                    .start();
                                            })
                                            .start();
                                    } else if (GameManage.instance.targetBlockId == BlockType.CARPWT) {
                                        //点击的是地毯
                                        //人物微笑
                                        GameManage.instance.people.playAnimation(PeopleStateName[PeopleState.HAPPY], 4);
                                        //替换地毯
                                        tween(GameManage.instance.carpteNode)
                                            .to(0.5, { scale: v3(0, 0, 0) }, { easing: "backIn" })
                                            .call(() => {
                                                GameManage.instance.carpteNode.active = false;
                                                //激活新的地毯
                                                let newCarpteNode = GameManage.instance.winNodes[GameManage.instance.targetBlockId];
                                                newCarpteNode.scale = v3(0, 0, 0);
                                                newCarpteNode.active = true;
                                                tween(newCarpteNode)
                                                    .to(0.5, { scale: v3(1, 1, 1) }, { easing: "backOut" })
                                                    .call(() => {
                                                        this.reShow();
                                                    })
                                                    .start();
                                            })
                                            .start();
                                    }
                                    //如果窗户没有被点击，切换窗户动画，播放有提示的窗户动画
                                    if (GameManage.instance.targetBlockId != BlockType.WINDOW && GameManage.instance.windowNode.active == true) {
                                        GameManage.instance.windowSkeleton.clearAnimation(0);
                                        GameManage.instance.windowSkeleton.setAnimation(1, "donghua2");
                                    }
                                    GameManage.instance.isinitBlock = true;
                                    GameManage.instance.selectLevel++;
                                    if (GameManage.instance.selectLevel >= GameManage.instance.levels.length) {
                                        GameManage.instance.selectLevel = 1;
                                    }
                                })
                                .start();
                        }
                        this.block = [];
                        this.blardNumber = 0;
                        this.canTouch = true;
                    })
                    .start();
            }
        }
    }

    update(deltaTime: number) {

    }
}


