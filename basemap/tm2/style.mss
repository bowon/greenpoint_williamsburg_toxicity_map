// Languages: name (local), name_en, name_fr, name_es, name_de
@name: '[name_en]';

// Fonts //
@sans: 'Arial Unicode MS Regular';
@sans_bold: 'Arial Unicode MS Bold';

/*
This style is designed to be easily recolored by adjusting the color
variables below. For predicatable feature relationships,
maintain or invert existing value (light to dark) scale.
*/

// Color palette //
@road:  #e5e8df;
@road2:  #e1e4d7; 
@land:  #f1f2ee;

@fill1: #faf7f5;
@fill2: #e4e2e2;
@fill3: #c2c1c1;
@fill4: #585656;

@text: #95afb0;

Map [zoom<10]{ background-color: @land; }
Map [zoom>=10]{ background-color: @fill1; }
// Political boundaries //
#admin[admin_level=2][maritime=0] {
  line-join: round;
  line-color: mix(@fill3,@fill2,50);
  line-width: 1;
  [zoom>=5] { line-width: 1.4; }
  [zoom>=6] { line-width: 1.8; }
  [zoom>=8] { line-width: 2; }
  [zoom>=10] { line-width: 3; }
  [disputed=1] { line-dasharray: 4,4; }
 
}

#admin[admin_level>2][maritime=0] {
  line-join: round;
  line-color: @fill2;
  line-width: 1;
  line-dasharray: 3,2;
  [zoom>=6] { line-width: 1.5; }
  [zoom>=8] { line-width: 1.8; }
}

// Land Features //
@park: #b0c0af;
#landuse[class='park']{
    polygon-fill: mix(@land,@park,80);
}
#landuse[class='cemetery'],
#landuse[class='wood'],
#landuse_overlay {
  polygon-fill: darken(@land,3);
  [zoom>=15] { polygon-fill:mix(@land,@fill2,95); }
}

#landuse[class='pitch'],
#landuse[class='sand'] { 
  polygon-fill: mix(@land,@fill4,90);
}

#landuse[class='hospital'],
#landuse[class='industrial'],
#landuse[class='school'] { 
  polygon-fill: mix(@land,@fill1,95);
}

#building { 
  polygon-fill: mix(@fill1,@land,60);
  [zoom>=16]{ polygon-fill: mix(@fill2,@land,100);}
}

#aeroway {
  ['mapnik::geometry_type'=3][type!='apron'] { 
    polygon-fill: mix(@fill2,@land,25);
    [zoom>=16]{ polygon-fill: mix(@fill2,@land,50);}
  }
  ['mapnik::geometry_type'=2] { 
    line-color: mix(@fill2,@land,25);
    line-width: 1;
    [zoom>=13][type='runway'] { line-width: 4; }
    [zoom>=16] {
      [type='runway'] { line-width: 6; }
      line-width: 3;
      line-color: mix(@fill2,@land,50);
    }
  }
}

// Water Features //
#water {
  ::shadow {
    polygon-fill: mix(@land,@water2,75);
  }
  ::fill {
    // a fill and overlay comp-op lighten the polygon-
    // fill from ::shadow.
    polygon-fill: @land;
    comp-op: soft-light;
    // blurring reveals the polygon fill from ::shadow around
    // the edges of the water
    image-filters: agg-stack-blur(10,10);
  }
}

// Water color is calculated by sampling the resulting color from
// the soft-light comp-op in the #water layer style above. 
@water: #586c88;
@water2: #2f6363;

#waterway {
  [type='river'],
  [type='canal'] {
    line-color: @water;
    line-width: 0.5;
    [zoom>=12] { line-width: 1; }
    [zoom>=14] { line-width: 2; }
    [zoom>=16] { line-width: 3; }
  }
  [type='stream'] {
    line-color: @water;
    line-width: 0.5;
    [zoom>=14] { line-width: 1; }
    [zoom>=16] { line-width: 2; }
    [zoom>=18] { line-width: 3; }
  }
}
