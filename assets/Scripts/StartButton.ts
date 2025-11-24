import { _decorator, Button, Component, Node, tween, v3 } from 'cc';
import { GameManage } from './GameManage';
const { ccclass, property } = _decorator;

@ccclass('StartButton')
export class StartButton extends Component {
    //id==0是窗户
    @property(Number)
    blockId: number = 0;
    isInit: boolean = false;
    start() {

    }

    onTouch() {
        tween(GameManage.instance.helpNode)
            .to(0.2, { scale: v3(0, 0, 0) }, { easing: 'backIn' })
            .call(() => {
                GameManage.instance.helpNode.active = false;
            })
            .start();
        //隐藏所有按钮
        for (let i = 0; i < GameManage.instance.startButton.length; i++) {
            //取消按钮的点击事件
            GameManage.instance.startButton[i].enabled = false;
            tween(GameManage.instance.startButton[i].node)
                .to(0.5, { scale: v3(0, 0, 0) }, { easing: 'backIn' })
                .call(() => {
                    if (GameManage.instance.startButton[i] == this.node.getComponent(Button)) {
                        //删除这个按钮
                        GameManage.instance.startButton.splice(i, 1);
                        //初始化关卡
                        GameManage.instance.initLevel(GameManage.instance.selectLevel, this.blockId);
                        GameManage.instance.onTouchStartButton(this.blockId);
                    }
                })
                .start();
        }
    }

    update(deltaTime: number) {
        if (this.isInit == false) {
            this.isInit = true;
            tween(this.node)
                .to(0.5, { scale: v3(0.7, 0.7, 0.7) }, { easing: 'backOut' })
                .call(() => {
                    let hand = GameManage.instance.helpNode;
                    this.node.getComponent(Button).enabled = true;
                    if (hand.active == false && this.node.active == true) {
                        hand.setParent(this.node);
                        hand.setPosition(v3(0, 0, 0));
                        hand.scale = v3(0, 0, 0);
                        hand.active = true;
                        GameManage.instance.helpNodeTween = tween(hand)
                            .to(0.3, { scale: v3(1.7, 1.7, 1.7) }, { easing: 'backOut' })
                            .start();
                    }
                })
                .start();
        }
    }
}


