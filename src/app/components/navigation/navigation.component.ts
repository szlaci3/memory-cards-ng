import { Component, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type Section = 'Words' | 'Sentences' | 'Legacy';

const sentencesPaths = ['/sentence', '/sentenceFull', '/sentenceInverse', '/sentenceList', '/sentenceForm'];
const legacyPaths = ['/groups', '/direct'];

const sectionDefaultPath: Record<Section, string> = {
  Words: '/',
  Sentences: '/sentence',
  Legacy: '/groups',
};

const sectionLinks: Record<Section, { name: string; path: string }[]> = {
  Words: [
    { name: 'Review', path: '/' },
    { name: 'Full', path: '/full' },
    { name: 'Inverse', path: '/inverse' },
    { name: 'List', path: '/list' },
    { name: 'Add', path: '/cardForm' },
  ],
  Sentences: [
    { name: 'Review', path: '/sentence' },
    { name: 'Full', path: '/sentenceFull' },
    { name: 'Inverse', path: '/sentenceInverse' },
    { name: 'List', path: '/sentenceList' },
    { name: 'Add', path: '/sentenceForm' },
  ],
  Legacy: [
    { name: 'Groups', path: '/groups' },
    { name: 'Direct', path: '/direct' },
  ],
};

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  private router = inject(Router);
  
  // Track current path as a signal
  currentPath = signal(this.router.url);

  constructor() {
    // Update currentPath signal on every navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event: any) => {
      this.currentPath.set(event.urlAfterRedirects);
    });
  }

  // Derive section from currentPath
  section = computed<Section>(() => {
    const path = this.currentPath();
    if (sentencesPaths.some(p => path === p || path.startsWith(p + '/'))) return 'Sentences';
    if (legacyPaths.some(p => path === p || path.startsWith(p + '/'))) return 'Legacy';
    return 'Words';
  });

  // Derive links based on active section
  activeLinks = computed(() => sectionLinks[this.section()]);

  onSectionChange(event: Event) {
    const section = (event.target as HTMLSelectElement).value as Section;
    this.router.navigateByUrl(sectionDefaultPath[section]);
  }
}
