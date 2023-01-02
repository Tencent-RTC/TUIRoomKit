light.execute("light://js/AEJSBridge.js");

class DynamicBehavior {
    constructor() {
        this.parentEntity = null;
    }

    configure(entityManager, eventManager, scriptSystem) {
        var parentEntityId = DynamicBehavior.behaviorEntityMap[this.constructor.name];
        this.parentEntity = entityManager.getEntity(parentEntityId);
    }

    update(deltaTime, entityManager, eventManager) {
    }
}

if (!light.BehaviorConstructors) {
    light.BehaviorConstructors = [];
}
if (!light.BehaviorInstances) {
    light.BehaviorInstances = [];
}

DynamicBehavior.behaviorEntityMap = {};
DynamicBehavior.behaviorScriptMap = {};
DynamicBehavior.removedScripts = [];

function bindBehaviorWithEntity(currentEntityId, currentScriptPath) {
    if (light.BehaviorConstructors[light.BehaviorConstructors.length - 1]) {
        var className = light.BehaviorConstructors[light.BehaviorConstructors.length - 1].name;
        DynamicBehavior.behaviorEntityMap[className] = currentEntityId;
        DynamicBehavior.behaviorScriptMap[className] = currentScriptPath;
    }
    if (DynamicBehavior.removedScripts.indexOf(currentScriptPath) != -1) {
        var index = DynamicBehavior.removedScripts.indexOf(currentScriptPath);
        DynamicBehavior.removedScripts.splice(index, 1);
    }
}

function addRemovedScript(scriptPath) {
    DynamicBehavior.removedScripts.push(scriptPath);
}

light.configure = function (entityManager, eventManager, scriptSystem) {
    light.BehaviorConstructors.forEach((behaviorConstructor) => {
        var parentEntityId = DynamicBehavior.behaviorEntityMap[behaviorConstructor.name];
        var scriptPath = DynamicBehavior.behaviorScriptMap[behaviorConstructor.name];
        if (DynamicBehavior.removedScripts.indexOf(scriptPath) == -1) {
            var behaviorInstance = new behaviorConstructor();
            light.BehaviorInstances.push(behaviorInstance);
            behaviorInstance.configure(entityManager, eventManager, scriptSystem);
        }
    });
    light.BehaviorConstructors = [];
}

light.update = function (deltaTime, entityManager, eventManager) {
    // 有新添加进来的Behavior
    if (light.BehaviorConstructors.length > 0) {
        light.BehaviorConstructors.forEach((behaviorConstructor) => {
            var parentEntityId = DynamicBehavior.behaviorEntityMap[behaviorConstructor.name];
            var scriptPath = DynamicBehavior.behaviorScriptMap[behaviorConstructor.name];
            if (DynamicBehavior.removedScripts.indexOf(scriptPath) == -1) {
                var behaviorInstance = new behaviorConstructor();
                light.BehaviorInstances.push(behaviorInstance);
                behaviorInstance.configure(entityManager, eventManager, null);
            }
        });
    }
    light.BehaviorInstances.forEach((behavior) => {
        var scriptPath = DynamicBehavior.behaviorScriptMap[behavior.constructor.name];
        if (behavior.update && DynamicBehavior.removedScripts.indexOf(scriptPath) == -1) {
            behavior.update(deltaTime, entityManager, eventManager);
        }
    });
}