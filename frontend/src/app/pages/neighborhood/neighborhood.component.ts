import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';

type MapCategory = 'Landmarks' | 'Restaurants' | 'Shopping';

interface MapPoint {
  name: string;
  description: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-neighborhood',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './neighborhood.component.html',
  styleUrl: './neighborhood.component.css'
})
export class NeighborhoodComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  readonly categories: MapCategory[] = ['Landmarks', 'Restaurants', 'Shopping'];
  readonly categoryData: Record<MapCategory, MapPoint[]> = {
    Landmarks: [
      {
        name: 'Depot Park',
        description: 'Public park and gathering space close to downtown Gainesville.',
        lat: 29.6439,
        lng: -82.3147
      },
      {
        name: 'University of Florida',
        description: 'Main UF campus and nearby student-focused neighborhood area.',
        lat: 29.6436,
        lng: -82.3549
      },
      {
        name: 'Ben Hill Griffin Stadium',
        description: 'Major local landmark and event location for the community.',
        lat: 29.6499,
        lng: -82.3484
      },
      {
        name: 'Bo Diddley Plaza',
        description: 'Downtown plaza with concerts, markets, and local events.',
        lat: 29.652,
        lng: -82.3252
      }
    ],
    Restaurants: [
      {
        name: 'Dragonfly Sushi',
        description: 'Popular downtown sushi spot.',
        lat: 29.6504,
        lng: -82.3259
      },
      {
        name: 'Satchel’s Pizza',
        description: 'Iconic Gainesville pizza restaurant.',
        lat: 29.6781,
        lng: -82.3285
      },
      {
        name: 'The Top',
        description: 'Downtown restaurant with a local crowd.',
        lat: 29.6512,
        lng: -82.3244
      }
    ],
    Shopping: [
      {
        name: 'Butler Plaza',
        description: 'Large shopping center with multiple stores.',
        lat: 29.6224,
        lng: -82.3711
      },
      {
        name: 'The Oaks Mall',
        description: 'Indoor mall and retail hub.',
        lat: 29.6575,
        lng: -82.4111
      },
      {
        name: 'Celebration Pointe',
        description: 'Mixed-use shopping and entertainment area.',
        lat: 29.6168,
        lng: -82.4152
      }
    ]
  };

  private readonly gainesvilleCenter: L.LatLngExpression = [29.6516, -82.3248];
  private readonly gainesvilleBounds = L.latLngBounds(
    [29.58, -82.42],
    [29.74, -82.22]
  );
  selectedCategory: MapCategory = 'Landmarks';
  activeItemName = '';
  private map: L.Map | null = null;
  private readonly markerLayer = L.layerGroup();
  private readonly categoryMarkers = new Map<string, L.CircleMarker>();

  get visibleItems(): MapPoint[] {
    return this.categoryData[this.selectedCategory];
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  recenterMap(): void {
    this.map?.setView(this.gainesvilleCenter, 13);
  }

  selectCategory(category: MapCategory): void {
    if (this.selectedCategory === category) {
      return;
    }

    this.selectedCategory = category;
    this.activeItemName = '';
    this.renderCategoryMarkers();
  }

  focusItem(item: MapPoint): void {
    if (!this.map) {
      return;
    }

    const marker = this.categoryMarkers.get(item.name);
    if (!marker) {
      return;
    }

    this.activeItemName = item.name;
    this.map.flyTo([item.lat, item.lng], 15, { duration: 0.5 });
    marker.openPopup();
  }

  private initializeMap(): void {
    if (this.map || !this.mapContainer?.nativeElement) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.gainesvilleCenter,
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false
    });

    this.map.setMaxBounds(this.gainesvilleBounds);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerLayer.addTo(this.map);
    this.renderCategoryMarkers();

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }

  private renderCategoryMarkers(): void {
    if (!this.map) {
      return;
    }

    this.markerLayer.clearLayers();
    this.categoryMarkers.clear();

    for (const item of this.visibleItems) {
      const marker = L.circleMarker([item.lat, item.lng], {
        radius: 8,
        color: '#1f7a3d',
        weight: 2,
        fillColor: '#28a745',
        fillOpacity: 0.85
      })
        .bindPopup(`<strong>${item.name}</strong><br>${item.description}`);

      marker.on('click', () => {
        this.activeItemName = item.name;
      });

      marker.addTo(this.markerLayer);
      this.categoryMarkers.set(item.name, marker);
    }
  }
}
