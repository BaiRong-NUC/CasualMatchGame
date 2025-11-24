import { _decorator, BoxCollider2D, Color, Component, Contact2DType, IPhysics2DContact, Node, Sprite, tween, UITransform, v3, Vec3 } from 'cc';
import { Board } from './Board';
import { GameManage } from './GameManage';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    blockId: number = 0;
    level: Node = null;
    board: Board = null;
    @property(Number)
    layerId: number = 0;
    blockLayer: Block[] = null;
    isplaying: boolean = false; //是否正在飞行
    prevPos: Vec3 = null;
    childPos = -1;
    start() {
        //注册点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onTouch, this);
        this.level = this.node.parent.parent;
        this.board = this.level.getChildByName("Board").getComponent(Board);
        let colider = this.node.getComponent(BoxCollider2D);
        this.prevPos = this.node.getPosition();
        this.childPos = this.node.getSiblingIndex();
        // console.log("blockId:" + this.blockId + "layerId:" + this.layerId + "childPos:" + this.childPos);
        if (colider != null) {
            colider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            colider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
    }

    onBeginContact(selfCollider: BoxCollider2D, otherCollider: BoxCollider2D, contact: IPhysics2DContact | null) {
        // console.log("接触到方块" + this.blockId);
        if (this.isplaying == true) {
            //正在飞行中
            return;
        }
        if (GameManage.instance.isinitBlock == true) {
            if (this.blockLayer == null) {
                this.blockLayer = [];
            }
            let otherBlock = otherCollider.node.getComponent(Block);
            if (otherBlock.layerId < this.layerId && this.blockLayer.indexOf(otherBlock) == -1) {
                //被上层挡住了
                this.blockLayer.push(otherBlock);
            }
        } else {
            //是按钮飞过来碰撞的，不做处理
        }
    }
    onEndContact(selfCollider: BoxCollider2D, otherCollider: BoxCollider2D, contact: IPhysics2DContact | null) {
        // console.log("离开方块" + this.blockId);
        let otherBlock = otherCollider.node.getComponent(Block);
        if (otherBlock.layerId < this.layerId && this.blockLayer.indexOf(otherBlock) != -1) {
            this.blockLayer.splice(this.blockLayer.indexOf(otherBlock), 1);
        }
    }

    onTouch() {
        // GameManage.instance.isinitBlock = false;
        if (this.node.parent.name == "Board") {
            console.log("无效点击");
            return;
        }
        if (this.blockLayer.length > 0) {
            console.log("被上层挡住了");
            for (let i = 0; i < this.blockLayer.length; i++) {
                console.log("被上层挡住了" + this.blockLayer[i].node.name + "的方块" + this.blockLayer[i].blockId);
                let position = this.node.getComponent(UITransform).convertToWorldSpaceAR(v3(0, 0, 0));
                position = this.level.getComponent(UITransform).convertToNodeSpaceAR(position);
                GameManage.instance.errorManage.playError(this.level, this.node, position, true);
            }
            return;
        }
        console.log("点击了方块" + this.blockId);
        if (GameManage.instance.selectLevel == 0) {
            //第一关不允许失败,检测当前块放进board上能否通关
            let targetId = GameManage.instance.getBlockId();
            if (targetId != -1 && this.blockId != targetId) {
                // console.log("当前块放进board上不能通关 targetId: ", targetId, "this.bockId", this.blockId, "blockName", this.node.name);
                //打印错误提示
                let position = this.node.getComponent(UITransform).convertToWorldSpaceAR(v3(0, 0, 0));
                position = this.level.getComponent(UITransform).convertToNodeSpaceAR(position);
                GameManage.instance.errorManage.playError(this.level, this.node, position, true);
                return;
            }
        }
        GameManage.instance.firstTouch = false;
        if (GameManage.instance.selectLevel == 0) {
            if (GameManage.instance.helpNode.active == true) {
                GameManage.instance.helpNodeTween.stop();
                GameManage.instance.helpNode.active = false;
            }
        } else {
            GameManage.instance.helpNodeTween = tween(GameManage.instance.helpNode)
                .to(0.2, { scale: v3(0, 0, 0) }, { easing: "backIn" })
                .call(() => {
                    GameManage.instance.helpNode.active = false;
                })
                .start();
        }
        this.board.addBoard(this.node);
    }

    update(deltaTime: number) {
        if (this.blockLayer != null) {
            //初始化完毕
            if (this.blockLayer.length == 0) {
                //上面没有遮挡
                // 变为正常颜色
                this.node.getComponent(Sprite).color = new Color(255, 255, 255, 255);
            } else {
                //上面有遮挡
                //图片变色
                this.node.getComponent(Sprite).color = new Color(71, 65, 65, 255);
            }
        }
    }
}


