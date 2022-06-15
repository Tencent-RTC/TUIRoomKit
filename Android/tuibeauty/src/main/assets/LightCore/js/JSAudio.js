(function () {
    // 定义light.Audio变量
    light.Audio = function (src) {
        // 保存当前src
        this.src = src;
        this.keyOfPath = null;
        this.entity = null;

        // 如果已经经过了configure，则直接初始化
        if (this.inputSources && this.entityManager) {
            this.init();
        }else {
            // 否则，则保存下来，等待configure之后重新初始化
            this.initializeList.push(this);
        }
    }

    // 原型链上加个列表，用来保存configure之前的数据
    light.Audio.prototype.initializeList = new Array();

    // 当经过configure之后，针对保留下来的数据进行重新初始化
    light.Audio.prototype.reInitAudioInList = function () {
        while (light.Audio.prototype.initializeList.length > 0) {
            let audio = light.Audio.prototype.initializeList.shift();
            audio.init();
        }
    }

    // 新增一个sdkTime，在update时更新，在newEntity时使用
    light.Audio.prototype.sdkTime = 0;

    // init里重新构建一个Entity出来
    light.Audio.prototype.init = function () {
        this.keyOfPath = this.inputSources.get(this.src);
        // 如果没有对应的resource，则return
        if (!this.keyOfPath || this.keyOfPath.length == 0) {
            return;
        }
        // 1. new出空壳Entity
        this.entity = this.entityManager.create();
        // 2. new出所需要的Component
        // 2.1
        let tc = new light.TimeControl();
        tc.updateCurrentTime(this.sdkTime);
        // 2.2
        let st = new light.ScreenTransform(new light.Rect(0, 0, 0, 0),           // anchor
            new light.Rect(-640, -360, 360, 640), // offset(bottom, left, right, top)
            new light.Vec2(0, 0),                 // pivot
            new light.Vec3(0, 0, 0),              // position
            new light.Quat(1, 0, 0, 0),           // rotation(w, x, y, z)
            new light.Vec3(1, 1, 1),              // scale
            true);                                // enable
        st.objectEnabled = true;
        // 2.3
        let as = new light.AudioSource(1, this.keyOfPath, 1, new light.VectorVolumeEffect());
        as.audioSourceType = 1;
        // 2.4
        // 3 将component塞到空壳Entity里
        this.entity.assignComponent(st);
        this.entity.assignComponent(as);
        this.entity.assignComponent(tc);
        // 做个保护
        if (!this.entity.valid()) {
            console.error("audio log, aduio entity is not valid");
        }
        this.entity.getTimeControlComponent().currentTime = 0;
    }

    // audio.pause()
    light.Audio.prototype.pause = function () {
        if (!this.entity || !this.entity.valid()) return;
        this.entity.getTimeControlComponent().pause = true;
    }

    // audio.play()
    light.Audio.prototype.play = function () {
        if (!this.entity || !this.entity.valid()) return;
        this.entity.getTimeControlComponent().pause = false;
    }

    // audio.paused
    light.Audio.prototype.__defineGetter__("paused", function(){
        if (!this.entity || !this.entity.valid()) return false;
        return this.entity.getTimeControlComponent().pause;
    });

    light.Audio.prototype.disable = function () {
        if (!this.entity || !this.entity.valid()) return;
        this.entity.getScreenTransformComponent().objectEnabled = false;
    }

    // audio.volume, value 0 - 1
    light.Audio.prototype.__defineSetter__("volume", function(val){
        if (!this.entity || !this.entity.valid()) return;
        return this.entity.getAudioSourceComponent().volume = val;
    });
    light.Audio.prototype.__defineGetter__("volume", function(){
        if (!this.entity || !this.entity.valid()) return 0;
        return this.entity.getAudioSourceComponent().volume;
    });

    // audio.currentTime
    light.Audio.prototype.__defineSetter__("currentTime", function(val){
        if (!this.entity || !this.entity.valid()) return;
        return this.entity.getTimeControlComponent().currentTime = val;
    });
    light.Audio.prototype.__defineGetter__("currentTime", function(){
        if (!this.entity || !this.entity.valid()) return 0;
        return this.entity.getTimeControlComponent().currentTime;
    });

    // audio.duration
    light.Audio.prototype.__defineGetter__("duration", function(){
        if (!this.entity || !this.entity.valid()) return 0;
        return this.entity.getTimeControlComponent().getControlDuration();
    });

    // audio.loop
    light.Audio.prototype.__defineSetter__("loop", function(val){
        if (!this.entity || !this.entity.valid()) return;
        return this.entity.getTimeControlComponent().loopCount = val;
    });
    light.Audio.prototype.__defineGetter__("loop", function(){
        if (!this.entity || !this.entity.valid()) return 0;
        return this.entity.getTimeControlComponent().loopCount;
    });

    // audio.muted
    light.Audio.prototype.__defineSetter__("muted", function(val){
        if (!this.entity || !this.entity.valid()) return;
        return this.entity.getScreenTransformComponent().objectEnabled = !val;
    });
    light.Audio.prototype.__defineGetter__("muted", function(){
        if (!this.entity || !this.entity.valid()) return 0;
        return !this.entity.getScreenTransformComponent().objectEnabled;
    });

    // todo 这里实现了audio.ended, 但是还有个ended event需要主动发起，这里可能还需要杨宗支持。
    light.Audio.prototype.__defineGetter__("ended", function(){
        if (!this.entity || !this.entity.valid()) return 0;
        let tc = this.entity.getTimeControlComponent();
        return tc.currentTime > tc.getControlDuration();
    });
}());

light.on("configure", function (entityManager) {
    // 1. 在configure里保存entityManager以备用
    light.Audio.prototype.entityManager = entityManager;

    // 2. 在configure里保存inputSources
    let inputSourcesString = light.AIDataUtils.GetDataFromDataCenter(entityManager, "inputSources");
    let inputSources = JSON.parse(inputSourcesString);
    // 2.1 转换数据结构为最简单的 {path : hashkey}
    let map = new Map();
    for ([key, info] of Object.entries(inputSources)) {
        map.set(info.path, key);
    }
    light.Audio.prototype.inputSources = map

    // 3 并将之前遗留下来的audio 重新初始化
    if (light.Audio.prototype.initializeList) {
        light.Audio.prototype.reInitAudioInList();
    }
});

// 实时更新一下currentTime
light.on("update", function (currentTime) {
    light.Audio.prototype.sdkTime = currentTime;
});