package com.tencent.qcloud.tuikit.tuibeauty.model;

public class TUIMotionModel {
    private String category;
    private String name;
    private String url;

    public String getCategory() {
        return category;
    }

    public String getName() {
        return name;
    }

    public String getUrl() {
        return url;
    }

    public TUIMotionModel(String category, String name, String url) {
        this.category = category;
        this.name = name;
        this.url = url;
    }

    @Override
    public String toString() {
        return "TUIMotionModel{" +
                "category='" + category + '\'' +
                ", name='" + name + '\'' +
                ", url='" + url + '\'' +
                '}';
    }
}
