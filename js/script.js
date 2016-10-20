(function(win, ns, $) {

  namespace = win[ns] || {}
  win[ns] = namespace

  namespace.canvasDrawer = {
    init: function() {
      console.log('init App')

      this.$component = $('[data-component~="canvas-zoom"]')
      this.url = this.$component.attr('src');
      this.locations = this.$component.data('locations')

      var canvas = document.getElementById('canvas');
      canvas.width = 900;
      canvas.height = 600;
      var ctx = canvas.getContext('2d');
      this.ctx = ctx;

      this.trackTransforms(ctx);

      this.bgImage = new Image;
      this.markerImage = new Image;

      var dragStart,dragged;

      canvas.addEventListener('mousedown',function(evt) {
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragStart = ctx.transformedPoint(lastX,lastY);
        dragged = false;
      }, false);

      canvas.addEventListener('mousemove',function(evt) {
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragged = true;
        if (dragStart) {
          var pt = ctx.transformedPoint(lastX,lastY);
          ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
          namespace.canvasDrawer.redraw(ctx);
        }
      }, false);

      canvas.addEventListener('mouseup',function(evt) {
        dragStart = null;
        if (!dragged) {
          namespace.canvasDrawer.zoom(evt.shiftKey ? -1 : 1 );
        }
      }, false);

      this.scaleFactor = 1.125;

      canvas.addEventListener('DOMMouseScroll', namespace.canvasDrawer.handleScroll, false);
      canvas.addEventListener('mousewheel', namespace.canvasDrawer.handleScroll, false);

      return ctx;
    },
    redraw: function(context) {
      var p1 = context.transformedPoint(0, 0);
      var p2 = context.transformedPoint(canvas.width, canvas.height);

      context.clearRect(p1.x, p1.y, p2.x-p1.x, p2.y-p1.y);
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();

      console.log(this.url);

      this.bgImage.src = this.url;

      namespace.rate = this.bgImage.width > this.bgImage.height ? canvas.width / this.bgImage.width : canvas.height / this.bgImage.height;
      // console.log('OriginalImageSize', this.bgImage.width, this.bgImage.height)
      // console.log('CanvasSize', canvas.width, canvas.height)
      context.drawImage(this.bgImage, 0, 0, this.bgImage.width * namespace.rate, this.bgImage.height * namespace.rate)


      $.each(namespace.canvasDrawer.locations, function(i, location) {
        context.drawImage(namespace.canvasDrawer.markerImage, location.x, location.y, 40, 50);
        context.drawImage(namespace.canvasDrawer.markerImage, location.x, location.y, 40, 50);
      });

      this.markerImage.src = 'img/marker.svg';
    },
    trackTransforms: function(ctx) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
      var xform = svg.createSVGMatrix();
      ctx.getTransform = function(){ return xform; };

      var savedTransforms = [];
      var save = ctx.save;
      ctx.save = function() {
        savedTransforms.push(xform.translate(0,0));
        return save.call(ctx);
      };

      var restore = ctx.restore;
      ctx.restore = function() {
        xform = savedTransforms.pop();
        return restore.call(ctx);
      };

      var scale = ctx.scale;
      ctx.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(ctx,sx,sy);
      };

      var rotate = ctx.rotate;
      ctx.rotate = function(radians) {
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(ctx,radians);
      };

      var translate = ctx.translate;
      ctx.translate = function(dx,dy) {
        xform = xform.translate(dx,dy);
        return translate.call(ctx,dx,dy);
      };

      var transform = ctx.transform;
      ctx.transform = function(a,b,c,d,e,f) {
        var m2 = svg.createSVGMatrix();
        m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(ctx,a,b,c,d,e,f);
      };

      var setTransform = ctx.setTransform;
      ctx.setTransform = function(a,b,c,d,e,f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx,a,b,c,d,e,f);
      };

      var pt  = svg.createSVGPoint();
      ctx.transformedPoint = function(x,y) {
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
      }
    },
    zoom: function(clicks){
      var ctx = namespace.canvasDrawer.ctx;
      var pt = ctx.transformedPoint(lastX,lastY);
      ctx.translate(pt.x,pt.y);
      var factor = Math.pow(this.scaleFactor,clicks);
      ctx.scale(factor,factor);
      ctx.translate(-pt.x,-pt.y);
      namespace.canvasDrawer.redraw(ctx);
    },
    handleScroll: function(evt){
      var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
      if (delta) {
        namespace.canvasDrawer.zoom(delta);
      }
      return evt.preventDefault() && false;
    }
  }



  $(function() {
      var context = namespace.canvasDrawer.init();
      namespace.canvasDrawer.redraw(context);
  });

})(window, 'namespace', jQuery)
