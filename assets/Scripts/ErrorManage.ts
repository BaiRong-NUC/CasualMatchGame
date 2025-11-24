import { _decorator, Component, Node, Sprite, SpriteFrame, tween, UITransform, v3, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

export class ErrorNode {
    public errorNode: Node = null; //错误节点
    isStop: boolean = true; //错误动画是否播放完毕
    sprite: Sprite = null; //错误节点的图片
    // runTime = 0;

    setSize(size: Vec2) {
        this.errorNode.getComponent(UITransform).setContentSize(size.x, size.y);
    }

    setParent(parent: Node, keepWorldTransform?: boolean) {
        this.errorNode.setParent(parent, keepWorldTransform || true);
    }
    constructor(error: Node | SpriteFrame, parent?: Node, keepWorldTransform?: boolean) {
        if (error instanceof Node) {
            this.errorNode = error;
        }
        else {
            let node = new Node();
            node.addComponent(Sprite);
            node.getComponent(Sprite).spriteFrame = error;
            node.name = "errorNode";
            node.active = false;
            this.errorNode = node;
            this.errorNode.setParent(parent, keepWorldTransform || true);
        }
        this.sprite = this.errorNode.getComponent(Sprite);
        this.errorNode.scale = v3(0, 0, 0);
    }
}
//管理错误提示
@ccclass('ErrorManage')
export class ErrorManage extends Component {
    //错误节点缓存
    public errorNodes: ErrorNode[] = [];
    public static instance: ErrorManage = null;
    start() {
        ErrorManage.instance = this;
    }

    constructByErrorPicture(error: Node | SpriteFrame, number: number = 1, parent?: Node, keepWorldTransform?: boolean, size?: Vec2) {
        for (let i = 0; i <= number; i++) {
            let errorNode = new ErrorNode(error, parent || this.node, keepWorldTransform);
            if (size != null) {
                errorNode.setSize(size);
            }
            errorNode.errorNode.scale = v3(0, 0, 0);
            this.errorNodes.push(errorNode);
            errorNode.errorNode.active = false;
        }
    }

    isPlayOver(errorNode: ErrorNode) {
        return errorNode.isStop;
    }

    //获取空闲的错误节点
    getErrorNode(): ErrorNode {
        for (let i = 0; i < this.errorNodes.length; i++) {
            if (this.isPlayOver(this.errorNodes[i])) {
                return this.errorNodes[i];
            }
        }
        //构造一个新的节点
        console.log("构造新节点");
        let errorNode = new ErrorNode(this.errorNodes[0].errorNode, this.node);
        errorNode.errorNode.active = false;
        errorNode.isStop = true;
        tween(errorNode).stop();
        this.errorNodes.push(errorNode);
        return errorNode;
    }

    playingNode: string[] = []; //正在播放的错误节点的名称
    playError(parent: Node, curNode: Node, position: Vec3, keepWorldTransform?: boolean): ErrorNode {
        if (this.playingNode.indexOf(curNode.uuid) != -1) {
            //如果父节点下有errorNode节点，说明正在播放
            console.log("错误提示正在播放")
            return null;
        }
        this.playingNode.push(curNode.uuid);
        let errorNode = this.getErrorNode();
        if (errorNode == null) {
            console.log("Error HelpManage playError fuction: this.getErrorNode retuen null.");
            return null;
        }
        errorNode.errorNode.setParent(parent, keepWorldTransform || true);
        errorNode.errorNode.position = position;
        errorNode.isStop = false;
        errorNode.errorNode.active = true;
        tween(errorNode.errorNode).stop();

        // 使用tween创建动画效果：
        // 1. 0.3秒内放大到0.2倍
        // 2. 等待0.5秒
        // 3. 0.3秒内缩小回0倍
        tween(errorNode.errorNode)
            .to(0.3, { scale: v3(1, 1, 1) })
            .delay(0.3)
            .to(0.3, { scale: v3(0, 0, 0) })
            .call(() => {
                errorNode.isStop = true; // 动画结束后标记为播放完毕
                errorNode.errorNode.active = false; // 隐藏错误节点
                errorNode.errorNode.setParent(this.node); // 重置父节点为初始节点
                let index = this.playingNode.indexOf(curNode.uuid); // 查找并删除节点名
                if (index != -1) {
                    this.playingNode.splice(index, 1); // 从数组中移除节点名
                }
            })
            .start();
        return errorNode;
    }

    update(deltaTime: number) {

    }
}


