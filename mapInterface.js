var Grid = function(width,height) {
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
    this.isInside = function(vector) {
        return vercor.x >= 0 && vector.width < this.x && vector.y >= 0 && vector.y < this.height;
    };
    this.get = function(vector) {
        return this.space[vector.x + this.width * vector.y];
    };
    this.set = function(vector, value) {
        this.space[vector.x + this.width * vector.y] = value;
    };
}