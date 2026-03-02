import { Component, input, signal, output, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import type { CardCategory, CardType } from '../../types';
import { CardComponent } from '../card/card.component';
import { selectNextCard } from '../../utils/utils';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './study-session.component.html',
  styleUrl: './study-session.component.scss'
})
export class StudySessionComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Inputs
  cards = input.required<CardType[]>();
  
  // Outputs
  rateCard = output<{ card: CardType, rate: number }>();

  // State
  selectedCategory = signal<CardCategory>('EN to NL');
  currentCardIndex = signal<number>(-1);

  // Computed
  filteredCards = computed(() => {
    const category = this.selectedCategory();
    return this.cards().filter(card => (card.category || 'EN to NL') === category);
  });

  currentCard = computed(() => {
    const filtered = this.filteredCards();
    const index = this.currentCardIndex();
    return index >= 0 && index < filtered.length ? filtered[index] : null;
  });

  constructor() {
    // 1. Handle initial card ID from query params
    const initialCardId = this.route.snapshot.queryParamMap.get('cardId');
    if (initialCardId) {
      // We'll set this once cards are available
    }

    // 2. Effect to manage category switching and initial card selection
    effect(() => {
      const allCards = this.cards();
      const filtered = this.filteredCards();
      const cat = this.selectedCategory();
      
      if (allCards.length === 0) return;

      // If current category has no cards, switch to first available
      if (filtered.length === 0) {
        const categoriesWithCards = new Set<CardCategory>();
        for (const card of allCards) {
          categoriesWithCards.add(card.category || 'EN to NL');
        }
        
        const allPossibleCategories: CardCategory[] = ['EN to NL', 'Question NL', 'Dev'];
        const firstAvailable = allPossibleCategories.find(c => categoriesWithCards.has(c));
        
        if (firstAvailable && firstAvailable !== cat) {
          this.selectedCategory.set(firstAvailable);
          return; // Next effect run will handle card selection
        }
      }

      // Handle card selection
      const qCardId = this.route.snapshot.queryParamMap.get('cardId');
      if (qCardId) {
        const index = filtered.findIndex(c => c.id === qCardId);
        if (index >= 0) {
          this.currentCardIndex.set(index);
          return;
        }
      }

      // Default selection algorithm
      if (this.currentCardIndex() === -1 && filtered.length > 0) {
        this.currentCardIndex.set(selectNextCard(filtered));
      }
    }, { allowSignalWrites: true });
  }

  handleCategoryChange(category: CardCategory) {
    this.selectedCategory.set(category);
    this.currentCardIndex.set(-1); // Triggers re-selection in effect
  }

  handleRateCard(rate: number) {
    const card = this.currentCard();
    if (!card) return;

    this.rateCard.emit({ card, rate });
    
    // Select next card
    const filtered = this.filteredCards();
    this.currentCardIndex.set(selectNextCard(filtered, this.currentCardIndex()));

    // Clear URL if we had a cardId
    if (this.route.snapshot.queryParamMap.has('cardId')) {
      this.router.navigate([], { 
        relativeTo: this.route,
        queryParams: { cardId: null },
        queryParamsHandling: 'merge',
        replace: true 
      });
    }
  }

  handleEdit(card: CardType) {
    this.router.navigate(['/cardForm', card.id]);
  }
}
