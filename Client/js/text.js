TextString = gamvas.Actor.extend({
    create: function(name, text, x, y, size, color, align) {
        this._super(name, x, y);
        this.text = text;
        this.color = typeof color !== 'undefined' ? color : '#FFF';
        this.size = typeof size !== 'undefined' ? size : 30;
        this.align = typeof align !== 'undefined' ? align : "left";
        this.font = '' + this.size + 'px Arial';
    },

    draw: function(t) {
        var st = gamvas.state.getCurrentState();
        st.c.fillStyle = this.color;
        st.c.font = this.font;
        st.c.textAlign = this.align;
        st.c.fillText(this.text, this.position.x, this.position.y);
    }
});
