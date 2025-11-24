import { _decorator, Component, Node, sp } from 'cc';
import { GameManage } from './GameManage';
const { ccclass, property } = _decorator;
export enum PeopleState {
    DEFAULT = 0,//默认
    SHIVER = 1,//颤抖
    HAPPY = 2,//开心
}
export const PeopleStateName: string[] = ["donghua1", "donghua2", "donghua3"];
@ccclass('People')
export class People extends Component {
    peopleSkeleton: sp.Skeleton = null;
    start() {
        this.peopleSkeleton = this.node.getComponent(sp.Skeleton);
    }

    //根据状态和时间播放不同的动画
    playAnimation(state: string, time: number) {
        this.peopleSkeleton.setAnimation(PeopleStateName.indexOf(state), state, true);
        this.scheduleOnce(() => {
            //切换成默认状态
            this.peopleSkeleton.clearAnimation(PeopleStateName.indexOf(state));
            if (GameManage.instance.rainNode == null) {
                //不下雨了
                this.peopleSkeleton.clearAnimation(PeopleState.SHIVER);
                this.peopleSkeleton.setAnimation(PeopleState.DEFAULT, PeopleStateName[PeopleState.DEFAULT], true)
            } else {
                //还下雨
                this.peopleSkeleton.setAnimation(PeopleState.SHIVER, PeopleStateName[PeopleState.SHIVER], true);
            }
        }, time);
    }

    update(deltaTime: number) {
    }
}


