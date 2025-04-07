/**
 * RoadManager.js
 * 
 * Manages the creation and updating of the perspective road.
 */

export class RoadManager {
  /**
   * Create a new RoadManager
   * 
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameConfig} config - The game configuration
   */
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.gameWidth = scene.cameras.main.width;
    this.gameHeight = scene.cameras.main.height;
    
    // Road segments
    this.roadSegments = [];
    
    // Reflections container
    this.reflectionContainer = null;
    this.reflections = [];
  }
  
  /**
   * Creates the perspective road
   */
  createPerspectiveRoad() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;

    // Create road segments that get narrower toward the horizon
    this.roadSegments = [];
    const segmentCount = this.config.segmentCount;
    
    // Create a container for reflections
    this.reflectionContainer = this.scene.add.container(0, 0);
    this.reflectionContainer.setDepth(3); // Above road but below most elements
    this.reflections = [];
    
    // Determine reflection properties based on time of day and weather
    let reflectionIntensity = 0.2; // Base reflection intensity
    
    // Adjust reflection intensity based on time of day
    if (this.config.timeOfDay === 'night') {
      reflectionIntensity = 0.4; // Stronger reflections at night
    } else if (this.config.timeOfDay === 'dusk' || this.config.timeOfDay === 'dawn') {
      reflectionIntensity = 0.3; // Medium reflections at dusk/dawn
    }
    
    // Adjust reflection intensity based on weather
    if (this.config.weather === 'rain') {
      reflectionIntensity *= 1.5; // Stronger reflections when wet
    } else if (this.config.weather === 'fog') {
      reflectionIntensity *= 0.7; // Weaker reflections in fog
    }

    // Create segments from horizon to bottom (narrower at horizon, wider at bottom)
    for (let i = 0; i < segmentCount; i++) {
      // Calculate segment position and size
      const segmentHeight = (this.gameHeight - horizonY) / segmentCount;
      const y = horizonY + (i * segmentHeight);

      // Calculate width with perspective (narrower toward horizon)
      const perspective = i / segmentCount;
      const width = this.gameWidth * this.config.roadWidth * (perspective * 0.7 + 0.3);

      // Create the segment
      const segment = this.scene.add.rectangle(
        this.gameWidth / 2, // x position (center)
        y + segmentHeight / 2, // y position (center of segment)
        width,
        segmentHeight,
        i % 2 === 0 ? 0x333333 : 0x444444 // Alternating colors
      );
      
      // Add glossy reflection effect to the road
      if (i > 0) { // Skip the first segment at the horizon
        // Create a reflection highlight on the road
        // The reflection is more visible on the lower part of the road (closer to viewer)
        const reflectionAlpha = reflectionIntensity * (i / segmentCount); // Stronger reflections closer to viewer
        
        // Create a gradient reflection that's stronger in the center of the road
        const reflection = this.scene.add.graphics();
        
        // Determine reflection color based on time of day
        let reflectionColor;
        switch (this.config.timeOfDay) {
          case 'dawn':
            reflectionColor = 0xE67E22; // Orange reflection at dawn
            break;
          case 'day':
            reflectionColor = 0x87CEEB; // Sky blue reflection during day
            break;
          case 'dusk':
            reflectionColor = 0xE74C3C; // Red-orange reflection at dusk
            break;
          case 'night':
            reflectionColor = 0xFFFFFF; // White/moonlight reflection at night
            break;
          default:
            reflectionColor = 0xFFFFFF; // Default white reflection
        }
        
        // Create a radial gradient for the reflection
        const gradientWidth = width * 0.8;
        reflection.fillStyle(reflectionColor, reflectionAlpha);
        reflection.fillRect(
          this.gameWidth / 2 - gradientWidth / 2,
          y,
          gradientWidth,
          segmentHeight * 0.8
        );
        
        // Add the reflection to the container
        this.reflectionContainer.add(reflection);
        this.reflections.push(reflection);
        
        // Add puddle reflections if it's raining
        if (this.config.weather === 'rain' && Math.random() < 0.3) {
          this.createRoadPuddle(y + segmentHeight / 2, width, segmentHeight, perspective);
        }
      }

      // Add to array
      this.roadSegments.push(segment);

      // Add lane markings
      if (this.config.laneCount > 1) {
        this.addLaneMarkings(segment, i, perspective);
      }
    }
  }
  
  /**
   * Creates static road borders on the left and right edges
   */
  createStaticRoadBorders() {
    // Calculate the horizon line position
    const horizonY = this.gameHeight * this.config.horizonLine;
    
    // Calculate the road width at the bottom of the screen
    const bottomRoadWidth = this.gameWidth * this.config.roadWidth;
    
    // Calculate the road width at the horizon (narrower due to perspective)
    const horizonRoadWidth = bottomRoadWidth * 0.1; // Much narrower at horizon
    
    // Calculate the left and right edge positions at the bottom
    const bottomLeftX = this.gameWidth / 2 - bottomRoadWidth / 2;
    const bottomRightX = this.gameWidth / 2 + bottomRoadWidth / 2;
    
    // Calculate the left and right edge positions at the horizon
    const horizonLeftX = this.gameWidth / 2 - horizonRoadWidth / 2;
    const horizonRightX = this.gameWidth / 2 + horizonRoadWidth / 2;
    
    // Create the left border (line shape to draw from bottom to horizon)
    const leftBorderLine = this.scene.add.graphics();
    leftBorderLine.lineStyle(4, 0xFF0000, 1);
    leftBorderLine.beginPath();
    leftBorderLine.moveTo(bottomLeftX, this.gameHeight); // Start at bottom
    leftBorderLine.lineTo(horizonLeftX, horizonY); // Draw to horizon
    leftBorderLine.strokePath();
    leftBorderLine.setDepth(6); // Above road
    
    // Create the right border (line shape to draw from bottom to horizon)
    const rightBorderLine = this.scene.add.graphics();
    rightBorderLine.lineStyle(4, 0xFF0000, 1);
    rightBorderLine.beginPath();
    rightBorderLine.moveTo(bottomRightX, this.gameHeight); // Start at bottom
    rightBorderLine.lineTo(horizonRightX, horizonY); // Draw to horizon
    rightBorderLine.strokePath();
    rightBorderLine.setDepth(6); // Above road
  }
  
  /**
   * Adds lane markings to a road segment
   *
   * @param {Phaser.GameObjects.Rectangle} segment - The road segment
   * @param {number} segmentIndex - The index of the segment
   * @param {number} perspective - The perspective factor (0-1)
   */
  addLaneMarkings(segment, segmentIndex, perspective) {
    const laneCount = this.config.laneCount;

    // Only add markings to every other segment for dashed lines
    if (segmentIndex % 2 !== 0) return;

    // Calculate lane widths
    const laneWidth = segment.width / laneCount;

    // Add lane markings
    for (let lane = 1; lane < laneCount; lane++) {
      // Calculate x position for this lane marking
      const xOffset = (lane * laneWidth) - (segment.width / 2);

      // Create lane marking
      const marking = this.scene.add.rectangle(
        segment.x + xOffset,
        segment.y,
        2, // width
        segment.height * 0.8, // height (slightly shorter than segment)
        0xFFFFFF // white color
      );

      // Store reference to the marking
      segment.laneMarkings = segment.laneMarkings || [];
      segment.laneMarkings.push(marking);
    }
  }
  
  /**
   * Creates a puddle reflection on the road
   *
   * @param {number} y - The y position of the puddle
   * @param {number} roadWidth - The width of the road at this position
   * @param {number} segmentHeight - The height of the road segment
   * @param {number} perspective - The perspective factor (0-1)
   */
  createRoadPuddle(y, roadWidth, segmentHeight, perspective) {
    // Randomly position the puddle on the road
    const puddleWidth = roadWidth * (0.1 + Math.random() * 0.2); // 10-30% of road width
    const puddleHeight = segmentHeight * (0.5 + Math.random() * 0.5); // 50-100% of segment height

    // Random position within the road width
    const offsetX = (Math.random() - 0.5) * (roadWidth - puddleWidth);
    const x = this.gameWidth / 2 + offsetX;

    // Create the puddle
    const puddle = this.scene.add.ellipse(
      x,
      y,
      puddleWidth,
      puddleHeight,
      0x0000FF, // Blue color
      0.2 // Low opacity
    );

    // Add a highlight to the puddle
    const highlight = this.scene.add.ellipse(
      x,
      y,
      puddleWidth * 0.7,
      puddleHeight * 0.7,
      0xFFFFFF, // White highlight
      0.1 // Very low opacity
    );

    // Set depth to be just above the road
    puddle.setDepth(3.5);
    highlight.setDepth(3.6);

    // Store reference to the highlight
    puddle.highlight = highlight;

    // Add to the reflection container
    this.reflectionContainer.add(puddle);
    this.reflectionContainer.add(highlight);
    this.reflections.push(puddle);
  }
  
  /**
   * Updates the road segments for scrolling effect
   */
  update() {
    // Update road segments to create scrolling effect
    for (let i = 0; i < this.roadSegments.length; i++) {
      const segment = this.roadSegments[i];
      segment.y += this.config.roadSpeed;
      
      // If the segment has lane markings, update them too
      if (segment.laneMarkings) {
        segment.laneMarkings.forEach(marking => {
          marking.y += this.config.roadSpeed;
        });
      }
      
      // If the segment goes off screen, move it back to the top
      if (segment.y > this.gameHeight + segment.height) {
        // Find the segment closest to the horizon
        let minY = Infinity;
        let horizonSegmentIndex = 0;
        
        for (let j = 0; j < this.roadSegments.length; j++) {
          if (this.roadSegments[j].y < minY) {
            minY = this.roadSegments[j].y;
            horizonSegmentIndex = j;
          }
        }
        
        // Calculate new y position near the horizon
        segment.y = minY - segment.height;
        
        // Calculate new width based on perspective
        const horizonY = this.gameHeight * this.config.horizonLine;
        const distanceFromHorizon = (segment.y - horizonY) / (this.gameHeight - horizonY);
        const newWidth = this.gameWidth * this.config.roadWidth * (distanceFromHorizon * 0.7 + 0.3);
        segment.width = newWidth;
        
        // Move this segment to the end of the array
        this.roadSegments.splice(i, 1);
        this.roadSegments.push(segment);
        i--; // Adjust index since we modified the array
      }
    }
    
    // Update reflections
    if (this.reflections && this.reflections.length > 0) {
      // Remove old reflections that have gone off screen
      for (let i = this.reflections.length - 1; i >= 0; i--) {
        const reflection = this.reflections[i];

        // Move the reflection with the road
        if (reflection.y !== undefined) {
          reflection.y += this.config.roadSpeed;

          // If it's a puddle with a highlight, move the highlight too
          if (reflection.highlight) {
            reflection.highlight.y += this.config.roadSpeed;
          }

          // Remove reflections that go off screen
          if (reflection.y > this.gameHeight + 100) {
            if (reflection.highlight) {
              reflection.highlight.destroy();
            }
            reflection.destroy();
            this.reflections.splice(i, 1);
          }
        } else if (reflection.type === 'Graphics') {
          // For graphics objects, we need to recreate them at the new position
          reflection.y += this.config.roadSpeed;
          if (reflection.y > this.gameHeight + 100) {
            reflection.destroy();
            this.reflections.splice(i, 1);
          }
        }
      }

      // Occasionally add new puddles if it's raining
      if (this.config.weather === 'rain' && Phaser.Math.Between(1, 60) === 1) {
        const horizonY = this.gameHeight * this.config.horizonLine;
        const segmentHeight = (this.gameHeight - horizonY) / this.config.segmentCount;
        const y = horizonY + segmentHeight; // Just below horizon
        const perspective = 0.1; // Near horizon
        const width = this.gameWidth * this.config.roadWidth * (perspective * 0.7 + 0.3);

        this.createRoadPuddle(y, width, segmentHeight, perspective);
      }
    }
  }
  
  /**
   * Get the position of a lane
   * 
   * @param {number} lane - The lane index
   * @returns {number} The x position of the lane
   */
  getLanePosition(lane) {
    // Calculate the road width
    const roadWidth = this.gameWidth * this.config.roadWidth;
    
    // Calculate the lane width
    const laneWidth = roadWidth / this.config.laneCount;
    
    // Calculate the left edge of the road
    const roadLeft = this.gameWidth / 2 - roadWidth / 2;
    
    // Calculate the lane position (center of the lane)
    return roadLeft + (lane * laneWidth) + (laneWidth / 2);
  }
}
