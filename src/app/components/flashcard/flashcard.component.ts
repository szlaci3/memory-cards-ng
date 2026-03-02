import { Component, input, signal, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CardType } from '../../types';
import { DbService } from '../../services/db.service';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcard.component.html',
  styleUrl: './flashcard.component.scss'
})
export class FlashcardComponent {
  private dbService = inject(DbService);

  card = input.required<CardType>();
  
  // State
  revealCount = signal(0);
  
  // Computed
  isDevCategory = computed(() => this.card().category === 'Dev');
  sidesToReveal = computed(() => this.card().sides.slice(0, this.revealCount() + 1));
  hasMoreSides = computed(() => this.card().sides.length - 1 > this.revealCount());

  // Events
  rate = output<number>();
  edit = output<CardType>();

  // Reset revealCount when card changes
  constructor() {
    // We can use an effect or just handle it in the wrapper which passes the signal
    // But since input is a signal, we can watch it.
  }

  showNextSide() {
    this.revealCount.update(v => v + 1);
  }

  async onAddToDefault() {
    const result = await this.dbService.addToDefaultGroup(this.card().id);
    alert(result.message);
  }

  onEditClick() {
    this.edit.emit(this.card());
  }

  reset() {
    this.revealCount.set(0);
  }
}
