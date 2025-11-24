import { _decorator, Component, native, Node, resources, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('i18nPicture')
export class i18nPicture extends Component {

    @property
    i18nKey: string = '';

    arr:string[] = ["en-US","de-DE","ru-RU","fr-FR","zh-TW","ko-KR","pt-PT","ja-JP","es-ES"]

    start() {
        var systemLanguage = navigator.language;
        if(this.arr.indexOf(systemLanguage) == -1){
           systemLanguage = "en-US";
        }

        resources.load(this.i18nKey+"/"+systemLanguage+"/spriteFrame",SpriteFrame,(err,spriteFrame:SpriteFrame)=>{
            console.log(err);
            this.getComponent(Sprite).spriteFrame = spriteFrame;
        })
       
    }
}


