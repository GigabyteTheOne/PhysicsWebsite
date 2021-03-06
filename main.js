﻿var mouseX = 0;
var mouseY = 0;
var lastMouseX = 0;
var lastMouseY = 0;
var windowWidth = 0;
var windowHeight = 0;

var scale = 2.4;
var gravity = 0.06;
var airResistance = 0.01;
var bounceResistance = 0.5;
var friction = 0.2;
var boxSize = 10*scale;
var springLength = 100*scale;
var tempBoxSize = boxSize;

var gravityActivated = true;
var springDrawingActivated = true;
var pointDrawingActivated = true;
var fixedPointCreationActivated = false;
var draggedExists = false;
var paused = false;

var middleMouseDown = false;
var shiftDown = false;
var leftMouseDown = false;
var ctrlDown = false;

var selectRadius = 20;

var points = [];
var springs = [];

var springColor = '#ECD56E';
var pointColor = '#ECD56E';
var selectedColor = '#ACA68E';
var fixedColor = '#85CFB9';

var styleCount = 0;

// Main function, called on document load.
function main() {
    $('#body').keydown(function (evt) {
        if (evt.which == 32) { // spacebar
            gravityActivated = !gravityActivated;
        }
        else if (evt.which == 83) { // s key
            springDrawingActivated = !springDrawingActivated;
        }
        else if (evt.which == 80) { // p key
            if (pointDrawingActivated) {

                tempBoxSize = boxSize;
                boxSize = 1;
            }
            else {
                boxSize = tempBoxSize;
            }
            pointDrawingActivated = !pointDrawingActivated;
        }
        else if (evt.which == 46) { // delete key
            points = [];
            springs = [];
        }
        else if (evt.which == 70) { // f key
            fixedPointCreationActivated = !fixedPointCreationActivated;
        }
        else if (evt.which == 85) { // u key
            paused = !paused;
        }
        else if (evt.which == 187) { // plus key
            springLength += 10;
        }
        else if (evt.which == 189) { // dash
            if (springLength > 10) {
                springLength -= 10;
            }
        }
        else if (evt.which == 16) { // shift key
            shiftDown = true;
        }
        else if(evt.which == 17) { // ctrl key
            ctrlDown = true;
        }
        else if(evt.which == 84) { // t key
            styleCount++;
            styleCount %= 3;

            $('body').animate({color : styleCount == 0 ? '#576375' : (styleCount == 1 ? 'white' : '#0C1021')}, 1000)
            $('.setting').animate({color : styleCount == 0 ? '#7F90AA' : (styleCount == 1 ? 'white' : '#0C1021')}, 1000)

        }
    });
    
    $('body').keyup(function(evt) {
        if (evt.which == 16) {
            shiftDown = false;
        }
        if (evt.which == 17) {
            ctrlDown = false;
        }
    });
    
    $('#myCanvas').mousedown(function (evt) {
        if (evt.button == 0) {
            leftMouseDown = true;
        }
        if (evt.button == 2) {
            selectPoints();
        }
        if (evt.button == 1) {
            middleMouseDown = true;
        }
        if (evt.button == 0 && !shiftDown && !ctrlDown) {
            createPoint();
        }
        if (evt.button == 0 && ctrlDown) {
            deletePoints();
        }
    });
    
    $('#body').mouseup(function(evt) {
        if (evt.button == 1) {
            middleMouseDown = false;
        }
        if (evt.button == 0) {
            leftMouseDown = false;
        }
    });
    
    $('#myCanvas').mousemove(function(evt) {
        mouseX = evt.offsetX;
        mouseY = evt.offsetY;
    });

    $('#myCanvas').on({ 'touchstart': function (evt) {
        if (evt.originalEvent.changedTouches && evt.originalEvent.changedTouches.length === 1)
        {
            lastMouseX = evt.originalEvent.changedTouches[0].clientX;
            lastMouseY = evt.originalEvent.changedTouches[0].clientY;
        }
        evt.originalEvent.preventDefault();
    }});

    $('#body').on({ 'touchend': function(evt) {
        if (evt.originalEvent.changedTouches && evt.originalEvent.changedTouches.length === 1)
        {
            mouseX = evt.originalEvent.changedTouches[0].clientX;
            mouseY = evt.originalEvent.changedTouches[0].clientY;

            middleMouseDown = false;

            if ((Math.abs(mouseX - lastMouseX) < 5) && (Math.abs(mouseY - lastMouseY) < 5))
            {
                //it's usial click
                if (isPointOnCoords())
                    selectPoints();
                else
                    createPoint();
            }
            else
            {
                //there was moving action
            }
        }
        evt.originalEvent.preventDefault();
    }});

    $('#myCanvas').on({ 'touchmove': function(evt) {
        if (evt.originalEvent.changedTouches && evt.originalEvent.changedTouches.length === 1)
        {
            middleMouseDown = true;
            mouseX = evt.originalEvent.changedTouches[0].clientX;
            mouseY = evt.originalEvent.changedTouches[0].clientY; 
        }
        evt.originalEvent.preventDefault();
    }});


    setInterval(doFrame, 5);
}

function updateSettings() {
    $('#PointDrawingOn')[0].innerHTML = pointDrawingActivated ? "enabled" : "disabled";
    $('#SpringDrawingOn')[0].innerHTML = springDrawingActivated ? "enabled" : "disabled";
    $('#GravityOn')[0].innerHTML = gravityActivated ? "enabled" : "disabled";
    $('#FixedPointCreation')[0].innerHTML = fixedPointCreationActivated ? "enabled" : "disabled";
    $('#Paused')[0].innerHTML = paused ? "paused" : "unpaused";
    $('#SpringSize')[0].innerHTML = springLength;
    $('#AmountOfPoints')[0].innerHTML = points.length;
    $('#AmountOfSprings')[0].innerHTML = springs.length;
}

// Draws the scene.
function draw() {
    var ctx = $('#myCanvas')[0].getContext('2d');
    for (var i = 0; i < springs.length; i++) {
        springs[i].draw(ctx);
    }

    for (var i = 0; i < points.length; i++) {
        points[i].draw(ctx);
    }
}

// Set up canvas, resize it to fit the screen and clear every frame.
function setUpCanvas() {
    var ctx = $('#myCanvas')[0].getContext('2d');
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    ctx.canvas.width = windowWidth;
    ctx.canvas.height = windowHeight;
}

// Updates the scene.
function update() {
    if (!paused) {
        for (var i = 0; i < points.length; i++) {
            points[i].update();
        }

        for (var i = 0; i < springs.length; i++) {
            springs[i].update();
        }
    }

    updateSettings();
    connectPoints();
    dragPoints();
}

// Called every frame, updates and draws the scene.
function doFrame() {
    setUpCanvas();
    draw();
    update();
}

// Drags points using the middle mouse button or shift click.
function dragPoints() {
    for (var i = 0; i < points.length; i++) {
        if (middleMouseDown || (shiftDown && leftMouseDown)) {
            if (new Vector(mouseX, mouseY).subtract(points[i].position).length() < selectRadius) {
                if (!points[i].isDragged && !draggedExists) {
                    points[i].isDragged = true;
                    draggedExists = true;
                }
                if (points[i].isDragged) {
                    points[i].lastPosition = points[i].position.copy();
                    points[i].position = new Vector(mouseX, mouseY);
                    points[i].velocity = new Vector(0, 0);
                }

            }
            else {
                if (points[i].isDragged) {
                    points[i].lastPosition = points[i].position.copy();
                    points[i].position = new Vector(mouseX, mouseY);
                    points[i].velocity = new Vector(0, 0);
                }
                else {
                    points[i].isDragged = false;
                }
            }
        }
        else {
            points[i].isDragged = false;
            draggedExists = false;
        }
    }
}

// deletes points that are closest to the mose when clicked.
function deletePoints() {
    var pointsToKeep = [];
    var springsToKeep = [];
    var deletedAtLeastOnePoint = false;

    for (var i = 0; i < points.length; i++) {
        if (points[i].position.subtract(new Vector(mouseX, mouseY)).length() > selectRadius) {
            pointsToKeep.push(points[i]);
        }
        else {
            deletedAtLeastOnePoint = true;
            for (var j = 0; j < springs.length; j++) {
                if (springs[j].first != points[i] && springs[j].second != points[i]) {
                    if ($.inArray(springsToKeep, springs[j])) {
                        springsToKeep.push(springs[j]);
                    }
                }
            }
        }
    }
    if(deletedAtLeastOnePoint) {
        springs = springsToKeep;
        points = pointsToKeep;
    }
}

function isPointOnCoords() {
    for (var i = 0; i < points.length; i++) {
        if (new Vector(mouseX, mouseY).subtract(points[i].position).length() < selectRadius) {
            return true;
        }
    }
    return false;
}

// Creates a mass point with the mouse position.
function createPoint() {
    var newPoint = new MassPoint(mouseX, mouseY);
    if (fixedPointCreationActivated) {
        newPoint.isFixed = true;
    }
    points.push(newPoint);
}

// Selects points that are next to the mouse cursor when you right click.
function selectPoints() {
    var foundDeletedSpring = false;
    for (var i = 0; i < points.length; i++) {
        if (new Vector(mouseX, mouseY).subtract(points[i].position).length() < selectRadius) {
            points[i].isSelected = true;
        }
    }
}

// checks whether or not the spring exists.
function springExists(otherSpring) {
    for (var i = 0; i < springs.length; i++) {
        if (springs[i].equals(otherSpring)) {
            return true;
        }
    }
    return false;
}

// Connects all points that are selected with springs.
function connectPoints() {
    var atLeastTwoSelected = false;
    for (var i = 0; i < points.length; i++) {
        for (var j = i + 1; j < points.length; j++) {
            if (points[i].isSelected && points[j].isSelected) {
                atLeastTwoSelected = true;
                var newSpring = new Spring(points[i], points[j]);
                if (!springExists(newSpring)) {
                    springs.push(newSpring);
                }
            }
        }
    }

    if (atLeastTwoSelected) {
        for (var i = 0; i < points.length; i++) {
            points[i].isSelected = false;
        }
    }
}

// Spring object, used for attracting points to eachother.
function Spring(firstPoint, secondPoint) {
    this.first = firstPoint;
    this.second = secondPoint;
}

// checks if the spring is equal to another.
Spring.prototype.equals = function (spring) {
    if (this.first == spring.first && this.second == spring.second) {
        return true;
    }
    return false;
};

// updates the spring, attracting the two affected points.
Spring.prototype.update = function () {
    var distanceVector = this.second.position.subtract(this.first.position);
    var distance = distanceVector.length();
    var adjustedDistance = distance - springLength;
    var velocity = distanceVector.normalize().multiply(1 / 100).multiply(adjustedDistance);
    this.first.velocity = this.first.velocity.add(velocity);
    this.second.velocity = this.second.velocity.subtract(velocity);
};
// draws the spring.
Spring.prototype.draw = function (ctx) {
    if (springDrawingActivated) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = springColor;
        ctx.beginPath();
        ctx.moveTo(this.first.position.x, this.first.position.y);
        ctx.lineTo(this.second.position.x, this.second.position.y);
        ctx.stroke();
    }
};

// MassPoint object, for storing and operating on points in 2d space.
function MassPoint(posX, posY) {
    this.position = new Vector(posX, posY);
    this.lastPosition = this.position.copy();
    this.velocity = new Vector(0, 0);
    this.isDragged = false;
    this.isSelected = false;
    this.isFixed = false;
}

 // updates the masspoint - moves it and changes the velocity.
MassPoint.prototype.update = function () {
    if (!this.isFixed) {
        if (gravityActivated) {
            this.velocity = this.velocity.add(new Vector(0, gravity));
        }
        this.lastPosition = this.position.copy();
        this.position = this.position.add(this.velocity);
        //this.position = this.position.add(this.position.subtract(this.lastPosition));
        this.velocity = this.velocity.multiply(1 - airResistance);
        this.collideWithWalls();
    }
};

// draws the masspoint.
MassPoint.prototype.draw = function (ctx) {
    if (pointDrawingActivated) {
        if (this.isSelected) {
            ctx.fillStyle = selectedColor;
        }
        else if (this.isFixed) {
            ctx.fillStyle = fixedColor;
        }
        else {
            ctx.fillStyle = pointColor;
        }
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, boxSize / 2 - 1, 0, 2 * Math.PI, false);
        ctx.fill();
    }
};
// handles collision of the masspoint with the sides of the window.
MassPoint.prototype.collideWithWalls = function () {
    if (this.position.x < boxSize / 2) { // if too far left.
        this.position.x = boxSize / 2;
        this.velocity.x = Math.abs(this.velocity.x) * (1 - bounceResistance);
        this.velocity.y *= 1 - friction;
    }

    if (this.position.y < boxSize / 2) { // if too far up.
        this.position.y = boxSize / 2;
        this.velocity.y = Math.abs(this.velocity.y) * (1 - bounceResistance);
        this.velocity.x *= 1 - friction;
    }

    if (this.position.x > windowWidth - boxSize / 2) { // if too far to the right.
        this.position.x = windowWidth - boxSize / 2;
        this.velocity.x = Math.abs(this.velocity.x) * -1 * (1 - bounceResistance);
        this.velocity.y *= 1 - friction;
    }

    if (this.position.y > windowHeight - boxSize / 2) { // if too far to the bottom.
        this.position.y = windowHeight - boxSize / 2;
        this.velocity.y = Math.abs(this.velocity.y) * -1 * (1 - bounceResistance);
        this.velocity.x *= 1 - friction;
    }
};

// Vector object for storing and operating on two-dimensional vectors.
function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.add = function (other) {
    return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.multiply = function (scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
};

Vector.prototype.subtract = function (other) {
    return this.add(other.multiply(-1));
};

Vector.prototype.length = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};

Vector.prototype.copy = function () {
    return new Vector(this.x, this.y);
};

Vector.prototype.normalize = function () {
    var vectorLength = this.length();
    if (this.length() > 0) {
        return new Vector(this.x / vectorLength, this.y / vectorLength);
    }
    else {
        return new Vector(0.1, 0.1);
    }
};