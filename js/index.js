window.onload = function() {
    let canvas = new CanvasArea({
        selector: '#paintArea',
        width: 800,
        height: 600,
        background: '/img/BGSample.jpg'
    });

    document.getElementById('BTNAdd8BitGlasses').onclick = function() {
        canvas.addImage('/img/8BitGlasses.png');
    }
    
    document.getElementById('BTNDelete').onclick = function() {
        canvas.deleteSelectedItem();
    }

    document.getElementById('BTNAddText').onclick = function() {
        let text = document.getElementById('txtMessage').value || "";
        if(text != '') {
            canvas.addText(text);
        }
    };

    document.getElementById('BTNEditText').onclick = function() {
        let text = document.getElementById('txtMessage').value || "";
        canvas.editSelectedText(text);
    };

      document.getElementById('BTNSave').addEventListener('click', function () {;
          canvas.save("Output.png");
    }, false);
}

class CanvasArea {
    constructor(opt) {
        this.options = opt;
        this.selector = opt.selector;
        this.width = opt.width;
        this.height = opt.height;

        this.stage = new Konva.Stage({
            container: this.selector,
            width: this.width,
            height: this.height,
        });

        // Set Background layer
        if(this.options.background) {
            this.setBackground();
        }

        // Set layer for content
        this.contentLayer = new Konva.Layer();
        this.stage.add(this.contentLayer);
        this.setTransformEvent();
    }

    setBackground() {
        this.backgroundLayer = new Konva.Layer();
        this.stage.add(this.backgroundLayer);
        
        let _this = this; // to use this in image.onload
        var imageObj = new Image();
        imageObj.onload = function () {
            let bgNode = new Konva.Image({
                name: 'bgNode',
                x: 0,
                y: 0,
                image: imageObj,
                width: _this.width,
                height: _this.height,
            });

            // add the shape to the layer
            
            _this.backgroundLayer.add(bgNode);
        };
        imageObj.src = this.options.background;
    }

    setTransformEvent() {
        let _this = this;
        if(!this.transformNode) {
            this.transformNode = new Konva.Transformer({
                flipEnabled: false,
                padding: 30,
            });
            this.contentLayer.add(this.transformNode);
        }
        this.transformNode.anchorCornerRadius(40);
        this.transformNode.borderStroke('white');
        this.transformNode.anchorStroke('black');
        this.transformNode.anchorFill('white');
        this.transformNode.anchorSize(40);
        // this.transformNode.nodes();

        // add a new feature, lets add ability to draw selection rectangle
        let selectionRectangle = new Konva.Rect({
            fill: 'rgba(255,255,255,0.25)',
            visible: false,
        });
        this.contentLayer.add(selectionRectangle);

        let x1, y1, x2, y2;
        this.stage.on('mousedown touchstart', (e) => {
            // do nothing if we mousedown on any shape
            if (e.target !== _this.stage && !e.target.hasName('bgNode')) {
                return;
            }
            e.evt.preventDefault();
            x1 = _this.stage.getPointerPosition().x;
            y1 = _this.stage.getPointerPosition().y;
            x2 = _this.stage.getPointerPosition().x;
            y2 = _this.stage.getPointerPosition().y;
    
            selectionRectangle.visible(true);
            selectionRectangle.width(0);
            selectionRectangle.height(0);
        });

        this.stage.on('mousemove touchmove', (e) => {
            // do nothing if we didn't start selection
            if (!selectionRectangle.visible()) {
                return;
            }
            e.evt.preventDefault();
            x2 = _this.stage.getPointerPosition().x;
            y2 = _this.stage.getPointerPosition().y;
    
            selectionRectangle.setAttrs({
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
            });
        });

        this.stage.on('mouseup touchend', (e) => {
            // do nothing if we didn't start selection
            if (!selectionRectangle.visible()) {
                return;
            }
            e.evt.preventDefault();
            // update visibility in timeout, so we can check it in click event
            setTimeout(() => {
                selectionRectangle.visible(false);
            });
    
            var shapes = _this.stage.find('.node');
            var box = selectionRectangle.getClientRect();
            var selected = shapes.filter((shape) =>
                Konva.Util.haveIntersection(box, shape.getClientRect())
            );
            _this.transformNode.nodes(selected);
        });

        this.stage.on('click tap', function (e) {
            // if we are selecting with rect, do nothing
            if (selectionRectangle.visible()) {
              return;
            }
    
            // if click on empty area - remove all selections
            if (e.target === _this.stage || e.target.hasName('bgNode')) {
                _this.transformNode.nodes([]);
              return;
            }
    
            // do nothing if clicked NOT on our rectangles
            if (!e.target.hasName('node')) {
              return;
            }
    
            // do we pressed shift or ctrl?
            const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
            const isSelected = _this.transformNode.nodes().indexOf(e.target) >= 0;
    
            if (!metaPressed && !isSelected) {
              // if no key pressed and the node is not selected
              // select just one
              _this.transformNode.nodes([e.target]);
            } else if (metaPressed && isSelected) {
              // if we pressed keys and node was selected
              // we need to remove it from selection:
              const nodes = this.transformNode.nodes().slice(); // use slice to have new copy of array
              // remove node from array
              nodes.splice(nodes.indexOf(e.target), 1);
              _this.transformNode.nodes(nodes);
            } else if (metaPressed && !isSelected) {
              // add the node into selection
              const nodes = this.transformNode.nodes().concat([e.target]);
              _this.transformNode.nodes(nodes);
            }
          });
    }

    addImage(imageSrc) {
        let _this = this; // to use this in image.onload
        let imageObj = new Image();
        imageObj.onload = function () {
            let yoda = new Konva.Image({
                name: 'node',
                x: (_this.width / 2) - (imageObj.width / 2),
                y: (_this.height / 2) - (imageObj.height / 2),
                image: imageObj,
                width: imageObj.width,
                height: imageObj.height,
                draggable: true
            });

            // add the shape to the layer
            
            _this.contentLayer.add(yoda);
        };
        imageObj.src = imageSrc;
    }

    addText(text) {
        let _this = this;
        let textNode = new Konva.Text({
            name: 'node',
            x: (_this.width / 2) - (text.length * 5),
            y: (_this.height / 2) - 10,
            text: text,
            fontSize: 20,
            padding: 15,
            fill: 'white',
            stroke: 'black',
            fillAfterStrokeEnabled: true,
            draggable: true
        });

        // add the shape to the layer
        
        _this.contentLayer.add(textNode);
    }

    editSelectedText(text) {
        let selectedNode = this.transformNode.nodes()[0];
        if(selectedNode) {
            selectedNode.text(text);
        }
    }

    deleteSelectedItem() {
        let nodes = this.transformNode.nodes();
        nodes.forEach(function(node) {
            node.destroy();
        });
        this.transformNode.nodes([]);
    }

    save(name) {
        let uri = this.stage.toDataURL({ pixelRatio: 1 });
        let link = document.createElement('a');
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}