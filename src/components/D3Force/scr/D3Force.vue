<script lang="ts">
import * as d3 from 'd3'
import { defineComponent, onMounted, ref } from 'vue'
import data from './data.json'

export default defineComponent({
  name: 'D3Force',
  emits: [''],
  setup() {
    const svgBox = ref<HTMLElement | null>(null)
    const typesBox = ref<HTMLElement | null>(null)
    const svgChart = ref<HTMLElement | null>(null)
    const types = ['licensing', 'suit', 'resolved']

    function chart() {
      const links = data.links.map(d => Object.create(d))
      const nodes = data.nodes.map(d => Object.create(d))

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force('charge', d3.forceManyBody().strength(-1600))
        .force('x', d3.forceX())
        .force('y', d3.forceY())

      const svg = d3.select(svgChart.value)
        .style('font', '12px sans-serif')
      // .on('mouseleave', function() {
      //   console.log('svg mouseleave')
      // })
      // .on('mousemove', function() {
      //   console.log('svg mousemove')
      // })
      // .on('click', function() {
      //   console.log('svg clicked')
      // })

      function setSize() {
        const typeHeight = d3.select(typesBox.value).node().getBoundingClientRect().height
        const { width, height } = d3.select(svgBox.value).node().getBoundingClientRect()
        svg.attr('width', width)
          .attr('height', height - typeHeight)
          .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
      }

      setSize()

      d3.select(window).on('resize', () => {
        setSize()
      })

      const color = d3.scaleOrdinal(types, d3.schemeCategory10)

      // Per-type markers, as they don't inherit styles.
      svg.append('defs').selectAll('marker')
        .data(types)
        .join('marker')
        .attr('id', d => `arrow-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', -0.5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', color)
        .attr('d', 'M0,-5L10,0L0,5')

      const link = svg.append('g')
        .attr('fill', 'none')
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('stroke', d => color(d.type))
        .attr('marker-end', d => `url(#arrow-${d.type})`)

      function mousemoved(event) {
        const [x, y] = d3.pointer(event)
        mouse = { x, y }
        simulation.alpha(0.6).restart()
      }

      function mouseleft() {
        mouse = null
      }

      // 拖动
      const drag = (simulation) => {
        function dragstarted(event, d) {
          if (!event.active)
            simulation.alphaTarget(0.6).restart()
          d.fx = d.x
          d.fy = d.y
        }

        function dragged(event, d) {
          mousemoved(event)
          d.fx = event.x
          d.fy = event.y
        }

        function dragended(event, d) {
          if (!event.active)
            simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }

        return d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      }

      const node = svg.append('g')
        .attr('fill', 'currentColor')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .call(drag(simulation))

      node.append('circle')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('r', 4)

      node.append('text')
        .attr('x', 8)
        .attr('y', '0.61em')
        .text(d => d.id)
        .clone(true).lower()
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)

      function linkArc(d) {
        const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y)
        return `
          M${d.source.x},${d.source.y}
          A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
        `
      }

      simulation.on('tick', () => {
        link.attr('d', linkArc)
        node.attr('transform', d => `translate(${d.x},${d.y})`)
      })
    }

    onMounted(() => {
      chart()
    })

    return {
      svgBox,
      typesBox,
      svgChart,
      types,
    }
  },
})
</script>

<template>
  <div ref="svgBox" class="svg-box">
    <div ref="typesBox" class="types">
      <span v-for="type in types" :class="type">{{ type }}</span>
    </div>
    <svg ref="svgChart" />
  </div>
</template>

<style scoped>
.types {
  padding: 6px;
}

.types span {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}

.licensing::before {
  content: "";
  width: 15px;
  height: 15px;
  margin-right: .5em;
  background: #1f77b4;
}

.suit::before {
  content: "";
  width: 15px;
  height: 15px;
  margin-right: .5em;
  background: #ff7f0e;
}

.resolved::before {
  content: "";
  width: 15px;
  height: 15px;
  margin-right: .5em;
  background: #2ca02c;
}
</style>
