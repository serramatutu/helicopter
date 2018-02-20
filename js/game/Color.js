'use strict';

// -------------------------------------- //
//                RGB Color               //
// -------------------------------------- //
function RGBColor(r, g, b) {
    this.r = Math.round(r);
    this.g = Math.round(g);
    this.b = Math.round(b);
}

RGBColor.prototype.toHexString = function() {
    return "#" + RGBColor.componentToHex(this.r) +
                 RGBColor.componentToHex(this.g) +
                 RGBColor.componentToHex(this.b);
}

RGBColor.prototype.toComponent = function() {
    return (this.r << 16) + (this.g << 8) + this.b;
}

RGBColor.fromComponent = function(c) {
    return new RGBColor(c >> 16, (c & 0x00FF00) >> 8, c & 0x0000FF);
}

RGBColor.fromHex = function(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? new RGBColor(parseInt(result[1], 16),
                                 parseInt(result[2], 16),
                                 parseInt(result[3], 16)) : null;
}

RGBColor.componentToHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

Object.defineProperties(RGBColor, {
    white: {
        get: function() {
            return new RGBColor(255, 255, 255);
        }
    },
    
    black: {
        get: function() {
            return new RGBColor(0, 0, 0);
        }
    }
})



// -------------------------------------- //
//           DayNight Color Pair          //
// -------------------------------------- //
function DayNightColorPair(dayColor, nightColor) {
    if (!(dayColor instanceof RGBColor) || !(nightColor instanceof RGBColor))
        throw new Error('Invalid color');

    this.dayColor = dayColor;
    this.nightColor = nightColor;
}

DayNightColorPair.prototype.transition = function(dayPercentage) {
    if (dayPercentage < 0 || dayPercentage > 1)
        throw new Error('Percentage must be between 0 and 1');
    
    dayPercentage = 1 - dayPercentage;

    var deltaR = Math.abs(this.dayColor.r - this.nightColor.r),
        deltaG = Math.abs(this.dayColor.g - this.nightColor.g),
        deltaB = Math.abs(this.dayColor.b - this.nightColor.b);

    return new RGBColor(this.dayColor.r + deltaR * dayPercentage,
                        this.dayColor.g + deltaG * dayPercentage,
                        this.dayColor.b + deltaB * dayPercentage);
}
