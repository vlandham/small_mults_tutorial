
# ---
# We are using a function to scope
# the creation of this chart.
# Check out http://bost.ocks.org/mike/chart/ 
# for the details and benefits
# ---
SmallMultiples = () ->
  # variables accessible to
  # the rest of the functions inside SmallMultiples
  width = 150
  height = 120
  margin = {top: 15, right: 10, bottom: 40, left: 35}
  data = []

  # these will be set to d3 selections later
  circle = null
  caption = null
  curYear = null

  # d3.bisector creates a bisect function that
  # can be used to search an array for a specific
  # value. We will use it later in mouseover.
  bisect = d3.bisector((d) -> d.date).left
  format = d3.time.format("%Y")

  xScale = d3.time.scale().range([0,width])
  yScale = d3.scale.linear().range([height,0])

  # These accessor functions are defined to
  # indicate the data attributes used for the 
  # x and y values. This makes it easier to
  # swap in your own data!
  xValue = (d) -> d.date
  yValue = (d) -> d.n

  # The large tickSize is used
  # to paint lines across the plots
  yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left").ticks(4)
    .outerTickSize(0)
    .tickSubdivide(1)
    .tickSize(-width)

  area = d3.svg.area()
    .x((d) -> xScale(xValue(d)))
    .y0(height)
    .y1((d) -> yScale(yValue(d)))

  line = d3.svg.line()
    .x((d) -> xScale(xValue(d)))
    .y((d) -> yScale(yValue(d)))

  # ---
  # Sets the domain for our x and y scales.
  # We want all the small multiples to have the
  # same domains, so we only have to do this once.
  # ---
  setupScales = (data) ->
    maxY = d3.max(data, (c) -> d3.max(c.values, (d) -> yValue(d)))
    maxY = maxY + (maxY * 1/4)
    yScale.domain([0,maxY])
    extentX = d3.extent(data[0].values, (d) -> xValue(d))
    xScale.domain(extentX)

  # ---
  # Creates new chart function. This is the 'constructor' of our
  # visualization. Again, this is based on 
  # Bostock's Reusable Chart paradigm. 
  # ---
  chart = (selection) ->
    selection.each (rawData) ->
      # Set local variable for input data.
      # Transformation of this data has already
      # been done by the time it reaches chart.
      data = rawData

      setupScales(data)

      # Create a div and an SVG element for each element in
      # our data array. Note that data is a nested array
      # with each element containing another array of 'values'
      div = d3.select(this).selectAll(".chart").data(data)
      gEnter = div.enter().append("div").attr("class", "chart")
        .append("svg").append("g")

      svg = div.select("svg")
      svg.attr("width", width + margin.left + margin.right )
      svg.attr("height", height + margin.top + margin.bottom )

      g = svg.select("g")
        .attr("transform", "translate(#{margin.left},#{margin.top})")
     
      # Invisible background rectangle that will
      # capture all our mouse movements
      g.append("rect")
        .attr("class", "background")
        .style("pointer-events", "all")
        .attr("width", width + margin.right )
        .attr("height", height)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout)

      # Because we bound our nested array to 
      # a 'selectAll' of SVG elements, each
      # svg element will be one of the nested
      # elements from that array. This means
      # each svg has its own key and its own
      # values array. Here, we use values to
      # draw our paths.
      lines = g.append("g")
      lines.append("path")
        .attr("class", "area")
        .style("pointer-events", "none")
        .attr("d", (c) -> area(c.values))
        
      lines.append("path")
        .attr("class", "line")
        .style("pointer-events", "none")
        .attr("d", (c) -> line(c.values))

      lines.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("y", height)
        .attr("dy", margin.bottom / 2 + 5)
        .attr("x", width / 2)
        .text((c) -> c.key)

      # Add a circle and caption to fill in
      # during mousemove
      circle = lines.append("circle")
        .attr("r", 2.2)
        .attr("opacity", 0)
        .style("pointer-events", "none")

      caption = lines.append("text")
        .attr("class", "caption")
        .attr("text-anchor", "middle")
        .style("pointer-events", "none")
        .attr("dy", -8)

      curYear = lines.append("text")
        .attr("class", "year")
        .attr("text-anchor", "middle")
        .style("pointer-events", "none")
        .attr("dy", 10)
        .attr("y", height)
      
      # Add axis last so the tick lines
      # show over the paths (Upshot style).
      g.append("g")
        .attr("class", "y axis")
        .call(yAxis)

  # ---
  # ---
  mouseover = () ->
    circle.attr("opacity", 1.0)
    mousemove.call(this)

  # ---
  # ---
  mousemove = () ->
    year = xScale.invert(d3.mouse(this)[0]).getFullYear()
    date = format.parse('' + year)
    # date = xScale.invert(d3.mouse(this)[0])
    
    # The index into values will be the same for all
    # of the plots, so we can save it here.
    index = 0
    circle.attr("cx", xScale(date))
      .attr "cy", (c) ->
        index = bisect(c.values, date, 0, c.values.length - 1)
        yScale(yValue(c.values[index]))

    caption.attr("x", xScale(date))
      .attr "y", (c) ->
        yScale(yValue(c.values[index]))
      .text (c) ->
        yValue(c.values[index])

    curYear.attr("x", xScale(date))
      .text(year)
  # mousemove = () ->
  #   date = xScale.invert(d3.mouse(this)[0])
  #   circle.attr("cx", xScale(date))
  #     .attr "cy", (c) ->
  #       index = bisect(c.values, date, 0, c.values.length - 1)
  #       yScale(yValue(c.values[index]))
  #   caption.attr("x", xScale(date))
  #     .text (c) ->
  #       index = bisect(c.values, date, 0, c.values.length - 1)
  #       yValue(c.values[index])

  # ---
  # ---
  mouseout = () ->
    circle.attr("opacity", 0)
    caption.text("")


  # ---
  # If you wanted to use different
  # data in this visual, you could 
  # pass in the xValue accessor function
  # using the x() getter/setter for
  # an instance of SmallMultiples.
  # ---
  chart.x = (_) ->
    if !arguments.length
      return xValue
    xValue = _
    chart

  # ---
  # And the yValue using this
  # getter/setter.
  # ---
  chart.y = (_) ->
    if !arguments.length
      return yValue
    yValue = _
    chart

  # final act of our wrapper function is to
  # return the internal chart function we have created
  return chart

# ---
# Convert the raw input data into the format
# that our visualization expects. 
# ---
transformData = (rawData) ->
  # format = d3.time.format("%b-%Y")
  format = d3.time.format("%Y")
  rawData.forEach (d) ->
    d.date = format.parse(d.year)
    d.n = +d.n
  nest = d3.nest()
    .key((d) -> d.category)
    .sortValues((a,b) -> d3.ascending(a.date, b.date))
    .entries(rawData)
  nest

# ---
# Helper function that simplifies the calling
# of our chart with it's data and div selector
# specified
# ---
plotData = (selector, data, plot) ->
  d3.select(selector)
    .datum(data)
    .call(plot)

# ---
# jQuery document ready.
# ---
$ ->

  plot = SmallMultiples()

  # ---
  # This function is called when
  # the data has been successfully loaded
  # and we can start visualizing!!
  # ---
  display = (error, rawData) ->
    if error
      console.log(error)

    data = transformData(rawData)
    plotData("#vis", data, plot)

  # I've started using Bostock's queue to load data.
  # The tool allows you to easily add more input files
  # if you need to (for this example it might be overkill or 
  # inefficient, but its good to know about).
  # https://github.com/mbostock/queue
  queue()
    .defer(d3.tsv, "data/askmefi_category_year.tsv")
    .await(display)

