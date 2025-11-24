import { _decorator, Component, Node, ParticleAsset, ParticleSystem2D, Vec2, Vec3, v3 } from 'cc';
const { ccclass, property } = _decorator;

export class ParticleNode {
    public particleNode: Node = null; //粒子节点
    // isFollow: boolean = false; //是否跟随父节点

    runTime: number = 0; //粒子运行时间

    isStop: boolean = true; //是否停止粒子

    particleSystem: ParticleSystem2D = null; //粒子系统

    particleAsset: ParticleAsset = null; //粒子资源

    setParent(parent: Node, keepWorldTransform?: boolean) {
        this.particleNode.setParent(parent, keepWorldTransform || true);
    }

    //通过粒子文件，或者粒子节点构造粒子节点
    constructor(name: string, particle: ParticleAsset | Node, parent?: Node, keepWorldTransform?: boolean) {
        if (particle instanceof Node) {
            this.particleNode = particle;
            this.particleAsset = particle.getComponent(ParticleSystem2D).file;
        }
        else {
            let node = new Node();
            node.addComponent(ParticleSystem2D);
            node.getComponent(ParticleSystem2D).file = particle;
            node.name = name;
            node.active = false;
            if (parent) {
                node.setParent(parent, keepWorldTransform || true);
            }
            this.particleNode = node;
            this.particleAsset = particle;
        }
        this.particleSystem = this.particleNode.getComponent(ParticleSystem2D);
        this.particleSystem.stopSystem();
        this.particleNode.active = false;
    }

    // playParticle() {

    // }
}

//管理粒子
@ccclass('ParticleManage')
export class ParticleManage extends Component {
    public static instance: ParticleManage = null;
    //通过粒子名称找到粒子类型数组
    public stringToParticleNodes: { [key: string]: ParticleNode[] } = {};

    //粒子备份，防止外部把已有粒子全部删掉，导致再次使用时找不到粒子
    public particleBackup: { [key: string]: ParticleNode } = {};

    start() {
        ParticleManage.instance = this;
    }

    //通过粒子格式文件构造粒子节点
    constructByParticleAsset(name: string, particle: ParticleAsset, number: number = 1, parent: Node = this.node, keepWorldTransform?: boolean) {
        for (let i = 1; i <= number; i++) {
            let particleNode = new ParticleNode(name, particle, parent, keepWorldTransform);
            if (this.stringToParticleNodes[name] == null) {
                //没有粒子
                this.stringToParticleNodes[name] = [particleNode];
            } else {
                //已经有粒子了
                this.stringToParticleNodes[name].push(new ParticleNode(name, particle, parent, keepWorldTransform));
            }
            //记录备份
            this.particleBackup[name] = particleNode;
        }
    }

    //判断粒子是否已经播放完毕
    isPlayOver(particleNode: ParticleNode) {
        return particleNode.isStop;
    }

    playParticle(name: string, parent: Node, position: Vec3, keepWorldTransform?: boolean): ParticleNode {
        let particleNode = this.getParticleNode(name);
        if (particleNode == null) {
            console.log("Error ParticleManage playParticle fuction: this.getParticleNode retuen null.\n try get: ", name + " Particle");
            return null;
        }
        particleNode.particleNode.scale = v3(1, 1, 1);
        particleNode.particleNode.setParent(parent, keepWorldTransform || true);
        particleNode.particleNode.active = true;
        particleNode.particleNode.position = position;
        particleNode.particleSystem.resetSystem();
        particleNode.isStop = false;
        particleNode.runTime = 0;
        return particleNode;
    }

    getParticleNode(name: string): ParticleNode {
        //从粒子池中获取对应名称的空闲粒子节点
        let particleNodes = this.stringToParticleNodes[name];
        if (particleNodes == null || particleNodes.length == 0) {
            //粒子被外部节点删空了，找到备份粒子构造
            this.constructByParticleAsset(name, this.particleBackup[name].particleAsset, 2, this.node, true);
        }
        for (let i = 0; i < particleNodes.length; i++) {
            if (this.isPlayOver(particleNodes[i])) {
                // console.log("粒子池中有空闲粒子节点");
                return particleNodes[i];
            }
        }
        //没有空闲粒子节点，构造新的粒子节点
        console.log("粒子管理-构造新粒子节点! particle name: " + name);
        let particleNode = new ParticleNode(name, particleNodes[0].particleNode);
        particleNode.particleSystem.stopSystem();
        particleNode.isStop = true;
        particleNodes.push(particleNode);
        return particleNode;
    }

    update(deltaTime: number) {
        for (let key in this.stringToParticleNodes) {
            let particleNodes = this.stringToParticleNodes[key];
            for (let i = 0; i < particleNodes.length; i++) {
                let particleNode = particleNodes[i];
                if (particleNode.particleNode.name == "") {
                    //粒子已经被外部消除了，停止维护这个粒子
                    this.stringToParticleNodes[key].splice(i, 1);
                    return;
                }
                if (particleNode.isStop == false && particleNode.particleNode.name != "") {
                    //粒子正在运行
                    particleNode.runTime += deltaTime;
                    if (particleNode.particleSystem.duration == -1 || particleNode.particleSystem.life == -1) {
                        //粒子是无限循环的，不回收
                        continue;
                    }
                    if (particleNode.runTime > particleNode.particleSystem.duration + particleNode.particleSystem.life) {
                        //粒子运行完毕，回收粒子
                        particleNode.particleSystem.stopSystem();
                        particleNode.particleNode.active = false;
                        particleNode.particleNode.parent = this.node;
                        particleNode.isStop = true;
                        particleNode.runTime = 0;
                        //DEBUG
                        // console.log("粒子运行完毕", particleNode.particleNode.name);
                    }
                }
            }
        }
    }
}


