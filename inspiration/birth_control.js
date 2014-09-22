define('data/methods.json',[],function() {
    return {
        // "No method": { "typical":85, "perfect":85, "continuing":0},
        "Condom (male)": { "typical":18, "perfect":2, "continuing":43},
        "Condom (female)": { "typical":21, "perfect":5, "continuing":41},
        "Pill, Evra patch, NuvaRing": { "typical":9, "perfect":0.3, "continuing":67},
        // "Evra patch": { "typical":9, "perfect":0.3, "continuing":67},
        // "NuvaRing": { "typical":9, "perfect":0.3, "continuing":67},
        "Diaphragm": { "typical":12, "perfect":6, "continuing":57},
        "Depo-Provera": { "typical":6, "perfect":0.2, "continuing":56},
        
        "Withdrawal": { "typical":22, "perfect":4, "continuing":46},
        "Spermicides": { "typical":28, "perfect":18, "continuing":42},
       
        // "Fertility awareness-based methods: Standard Days": { "typical":24, "perfect":5, "continuing":47},
        // "Fertility awareness-based methods: Two Day": { "typical":24, "perfect":4, "continuing":47},
        "Fertility awareness-based<sup>1</sup>": { "typical":24, "perfect":3, "continuing":47},
        // "Fertility awareness-based methods: Symptothermal": { "typical":24, "perfect":0.4, "continuing":47},
       
        "Sponge (after giving birth)": { "typical":24, "perfect":20, "continuing":36}, //  (Parous women)
        "Sponge (prior to any births)": { "typical":12, "perfect":9, "continuing":36}, //  (Nulliparous women)
        
        "Copper IUD": { "typical":0.8, "perfect":0.6, "continuing":78}, //  IUCs ParaGard (copperT)
        "Levonorgestrel IUD": { "typical":0.2, "perfect":0.2, "continuing":80}, // IUCs Mirena (LNG)
        "Hormonal implant": { "typical":0.05, "perfect":0.05, "continuing":84}, // Implanon
        "Female sterilization": { "typical":0.5, "perfect":0.5, "continuing":100},
        "Male sterilization": { "typical":0.15 /* 0.15 */, "perfect":0.15, "continuing":100}
    };
});
require([
  'jquery/nyt',
  'underscore/1.5',
  'foundation/views/page-manager',
  'http://int.nyt.com/newsgraphics/lib/gka/d3.min.js',
  'data/methods.json'
  // 'resizerScript'  // uncomment this line to include resizerScript
  ], function($, _, PageManager, d3, methods) {

    var graphic = d3.select('#g-pregnancies .g-charts');
    var has_rolled_over = false;

    abTest(function() { return has_rolled_over; });

  // begin code for your graphic here:
    var total_years = 10;

    var zones = [
        { y0: 0, y1: 25, color: '#999999', label: 'less than 25' },
        { y0: 25, y1:50, color: '#ffb87f', label: '25 to 50' },
        { y0: 50, y1:100, color: '#cc0000', label: 'more than 50' }
    ];

    var data = d3.keys(methods).map(function(method) {
        var values = d3.range(total_years).map(function(i) {
            return {
                year: i+1,
                method: method,
                typical: d3.round((1 - Math.pow(1 - methods[method].typical/100, i+1))*100,1),
                perfect: d3.round((1 - Math.pow(1 - methods[method].perfect/100, i+1))*100,1)
            };
        });
        return { name: method, values: values, last: values[values.length-1] };
    }).sort(function(a,b) {
        return methods[b.name].typical - methods[a.name].typical;
    });

    render();

    $(window).resize(_.debounce(render, 300));

    function render() {

        var panel = graphic.html('').selectAll('div.g-panel')
            .data(data).enter()
          .append('div.g-panel');

        var margin = { left: 15, top: 23, right: 15, bottom: 20 };

        var owidth = panel.node().clientWidth, //graphic.node().clientWidth,
            oheight = panel.node().clientHeight, //750,
            width = owidth - margin.left - margin.right,
            height = oheight - margin.top - margin.bottom;

        var x = d3.scale.linear().domain([1,total_years]).range([0, width]).clamp(true),
            y = d3.scale.linear().domain([0,100]).range([height, 0]);

        var perfect_line = line('perfect'),
            typical_line = line('typical'),
            area = d3.svg.area()
                .x(function(d) { return x(d.year); })
                .y0(function(d) { return y(d.perfect); })
                .y1(function(d) { return y(d.typical); })
                .interpolate('basis');

        panel.append('div.g-caption')
            .html(function(d) { return d.name; });

        var svg = panel.append('svg')
            .attr('width', owidth)
            .attr('height', oheight)
          .append('g')
            .attr('transform', 'translate('+margin.left+','+margin.top+')');

        add_gradient(svg);

        svg.append('rect.bg')
            .attr({ x: -10, width: width + 20, height: height });

        svg.each(function(d, i) {
            if (i == 1) {
                var g = d3.select(this);
                g.append('text.legend').text('Typical Use').attr({ x: x(7), y: y(68) });
                g.append('text.legend').text('Perfect Use').attr({ x: x(7), y: y(8) });
            }
        });

        var zone = svg.append('g.zones')
            .selectAll('.zone')
            .data(zones).enter()
          .append('g.zone');

        zone.append('line')
            .attr('transform', function(d) { return 'translate(0,'+y(d.y0)+')'; })
            .attr('class', function(d) { return 'z-'+d.y0+'-'+d.y1; })
            .attr('x2', width);

        zone.append('rect')
            .attr('class', function(d) { return 'z-'+d.y0+'-'+d.y1; })
            .attr('width', width)
            .attr('y', function(d) { return y(d.y1); })
            .attr('height', function(d) { return y(d.y0) - y(d.y1)-1; });

        zone.append('text.label')
            .attr('x', width-5)
            .attr('y', function(d) {
                return y(d.y0)-8;
            })
            .text(function(d) { 
                return d.label;
            });

        var t_val = svg.append('text.value')
            .attr({ x: 7, y: 20 })
            .text(function(d) { return d3.round(d.last.typical) + ' in 100'; });
        var t_years = svg.append('text.after-years')
            .attr({ x: 7, y: 35 })
            .text(function(d) { return 'after '+total_years+' years'; });
        var t_use = svg.append('text.typical-use')
            .attr({ x: 7, y: 35+13 })
            .text(function(d) { return 'typical use'; });
        
        var ygrid = svg.append('g.y.axis')
            .selectAll('.grid-line')
            .data([0,10,25,50,75,100])
          .enter()
            .append('g.grid-line')
            .attr('transform', function(d) { return 'translate(0,'+y(d)+')'; });

        // ygrid.append('line').attr({ x1: -14, x2: -7 });
        // ygrid.append('text').text(function(d) { return d; }).attr({ y: 6, x: -4 });

        var xgrid = svg.append('g.x.axis')
            .selectAll('.grid-line')
            .data(d3.range(1,total_years+1,total_years > 15 ? 2 : 1))
          .enter()
            .append('g.grid-line')
            .attr('transform', function(d) { return 'translate('+x(d)+',0)'; });

        xgrid.append('line').attr({ y2: height });
        xgrid.append('text')
            .text(function(d,i) { return d+(i ? '' : ' yr'); })
            .attr({ y: height+15, x: 0 });

        var g = svg.append('g.method');
            
        g.append('path.typical').style('stroke', 'url(#grad)').attr('d', function(d) { return typical_line(d.values); });
        g.append('path.perfect').attr('d', function(d) { return perfect_line(d.values); })
            .style('opacity', function(d) { return d.last.typical == d.last.perfect ? 0 : 1; });
        g.append('path.area').attr('d', function(d) { return area(d.values); });

        var tt = g.append('g.tooltip');
        var t_circle = tt.append('circle').attr('r', 3.2);

        update_tt(total_years);

        svg.on('mousemove', mousemove)
            .on('touchmove', mousemove);

        function mousemove(d) {
            var m = d3.mouse(this),
                year = d3.round(x.invert(m[0])),
                mval = y.invert(m[1]),
                v = d.values[year-1],
                hl = Math.abs(mval - v.typical) < Math.abs(mval - v.perfect) ? 'typical' : 'perfect';
            has_rolled_over = true;
            xgrid.classed('hover', function(y) { return year == y; });
            update_tt(year, hl);
        }

        svg.on('mouseleave', function() {
            xgrid.classed('hover', false);
            update_tt(total_years);
        });

        // $('.interactive-meta-footer').append($('#sharetools-footer'));

        function update_tt(yr, hl) {
            hl = hl || 'typical';
            t_val.text(function(d) { return (d.values[yr-1][hl] >= 0.5 ? d3.round(d.values[yr-1][hl]) : 'less than 1') + ' in 100'; });
            t_years.text(function(d) { return 'after '+yr+' year'+(yr > 1 ? 's' : ''); });
            t_use.text(hl+' use').style('opacity', function(d) { return d.last.typical == d.last.perfect ? 0 : 1; });
            t_circle
                .style('fill', hl == 'typical' ? function(d) {
                    if (d.last.typical == d.last.perfect) return '#555';
                    var dotCol = zones.filter(function(z) { return d.values[yr-1][hl] >= z.y0 && d.values[yr-1][hl] < z.y1;  })[0].color;
                    return d3.lab(dotCol).darker(1.5)+'';
                }
                : '#555');
            tt.attr('transform', function(d) {
                return 'translate('+x(yr)+','+y(d.values[yr-1][hl])+')';
            });
        }

        function line(type) {
            return d3.svg.line()
                .x(function(d) { return x(d.year); })
                .y(function(d) { return y(d[type]); })
                .interpolate('basis');
        }

        function add_gradient(svg) {
            var gradients = svg.append('g.gradient');

            var colorStops = [];
            zones.forEach(function(d, i) {
                colorStops.unshift({ offset: (100-Math.max(d.y0+3,0)) + '%', color: d.color });
                colorStops.unshift({ offset: (100-Math.min(d.y1-3,100)) + '%', color: d.color });
            });

            gradients.append('linearGradient')
                .attr('id', 'grad')
                .attr('gradientUnits', 'userSpaceOnUse')
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", 0).attr("y2", height)
                .selectAll('stop')
                  .data(colorStops)
                .enter().append('stop')
                  .attr('offset', function(d) { return d.offset; })
                  .attr('stop-color', function(d) { return d.color; });
        }
    }

    function abTest(converted) {
        var ab_group = getABGroup(0.5);
        if (ab_group == 'A') d3.select('#g-pregnancies').classed('group-a', true);

        logConversionRate('pregnancies / rollover', ab_group, converted, 15);
        logConversionRate('pregnancies / rollover', ab_group, converted, 30);
        logConversionRate('pregnancies / rollover', ab_group, converted, 45);
        logConversionRate('pregnancies / rollover', ab_group, converted, 60);

        function getABGroup(prob) {
            return (window.localStorage && window.localStorage.__nytg_ab) ?
                window.localStorage.__nytg_ab : window.localStorage ?
                (window.localStorage.__nytg_ab = randGroup()) : randGroup();
            function randGroup() { return Math.random() < prob ? 'A' : 'B'; }
        }

        function logConversionRate(category, group, converted, afterSeconds) {
            setTimeout(function() {
                trackEvent(category, group + ' / total', 'after '+afterSeconds+' seconds');
                if (converted()) trackEvent(category, group + ' / yes', 'after '+afterSeconds+' seconds');
            }, afterSeconds * 1000);
        }
    }

    function trackEvent(category, action, opt_label, opt_value) {
        try {
        if (_gaq) _gaq.push(['_trackEvent', category, action, opt_label || null, opt_value || null]);
        } catch (e) { }
    }
}); // end require
;
define("script", function(){});


