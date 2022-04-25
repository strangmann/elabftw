/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare let key: any; // eslint-disable-line @typescript-eslint/no-explicit-any
import Tribute from 'tributejs';
type value = {value: string};
type TributeValue = Tribute<value>;

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname !== '/search.php') {
    return;
  }
  // scroll to anchor if there is a search
  const params = new URLSearchParams(document.location.search.slice(1));
  if (params.has('type')) {
    window.location.hash = '#anchor';
  }

  const extendedArea = (document.getElementById('extendedArea') as HTMLTextAreaElement);

  function getAutocompleteValues(field): Array<value> {
    return extendedArea.dataset[field].split('|').sort().map(v => {
      let quotes = '';
      if (v.includes(' ')) {
        quotes = '"';
      }
      return {value: `${field}:${quotes}${v}${quotes} `};
    });
  }

  function initAutocomplete(oldTribute?: TributeValue): TributeValue {
    if (oldTribute) {
      oldTribute.detach(extendedArea);
    }

    const searchIn = (document.getElementById('searchin') as HTMLSelectElement).value;

    const tribute = new Tribute({
      autocompleteMode: true,
      replaceTextSuffix: '',
      noMatchTemplate: () => null,
      lookup: 'value',
      selectTemplate: item => {
        if (typeof item === 'undefined') {
          return null;
        }
        return item.original.value;
      },
      // menuItemLimit is not included in tributejs.d.ts
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      menuItemLimit: 6,
      values: [
        {value: 'attachment:'},
        {value: 'attachment:no '},
        {value: 'attachment:yes '},
        ...getAutocompleteValues('author'),
        {value: 'body:'},
        ...(searchIn === 'database'
          ? getAutocompleteValues('category')
          : []
        ),
        {value: 'date:'},
        {value: 'elabid:'},
        ...getAutocompleteValues('group'),
        {value: 'locked:no '},
        {value: 'locked:yes '},
        ...getAutocompleteValues('rating'),
        ...(searchIn === 'experiments'
          ? getAutocompleteValues('status')
          : []
        ),
        {value: 'timestamped:no '},
        {value: 'timestamped:yes '},
        {value: 'title:'},
        ...getAutocompleteValues('visibility'),
      ],
    });
    tribute.attach(extendedArea);
    return tribute;
  }
  let tribute = initAutocomplete();

  if ((document.getElementById('searchin') as HTMLSelectElement).value === 'database') {
    document.getElementById('searchStatus').toggleAttribute('hidden', true);
    document.getElementById('searchCategory').toggleAttribute('hidden', false);
  }

  document.getElementById('searchin').addEventListener('change', event => {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'experiments') {
      document.getElementById('searchStatus').toggleAttribute('hidden', false);
      document.getElementById('searchCategory').toggleAttribute('hidden', true);
    }
    if (value === 'database') {
      document.getElementById('searchStatus').toggleAttribute('hidden', true);
      document.getElementById('searchCategory').toggleAttribute('hidden', false);
    }
    if (value !== 'database' && value !== 'experiments') {
      document.getElementById('searchStatus').toggleAttribute('hidden', true);
      document.getElementById('searchCategory').toggleAttribute('hidden', true);
    }
    // update autocomplete values
    tribute = initAutocomplete(tribute);
  });

  // Submit form with ctrl+enter from within textarea
  extendedArea.addEventListener('keydown', event => {
    if ((event.keyCode == 10 || event.keyCode == 13) && (event.ctrlKey || event.metaKey)) {
      (document.getElementById('searchButton') as HTMLButtonElement).click();
    }
  });

  // Main click event listener
  document.getElementById('container').addEventListener('click', event => {
    const el = (event.target as HTMLElement);
    // Add a new key/value inputs block on top of the + button in metadata search block
    if (el.matches('[data-action="add-extra-fields-search-inputs"]')) {
      // the first set of inputs is cloned
      const row = (document.getElementById('metadataFirstInputs').cloneNode(true) as HTMLElement);
      // remove id 'metadataFirstInputs'
      row.removeAttribute('id');
      // give new ids to the labels/inputs
      row.querySelectorAll('label').forEach(l => {
        const id = crypto.randomUUID();
        l.setAttribute('for', id);
        const input = l.nextElementSibling as HTMLInputElement;
        input.setAttribute('id', id);
        input.value = '';
      });
      // add inputs block
      el.parentNode.insertBefore(row, el);
    }
  });

  function getOperator(): string {
    const operatorSelect = document.getElementById('dateOperator') as HTMLSelectElement;
    return operatorSelect.value;
  }

  // a filter helper can be a select or an input (for date), so we need a function to get its value
  function getFilterValueFromElement(element: HTMLElement): string {
    if (element instanceof HTMLSelectElement) {
      // clear action
      if (element.options[element.selectedIndex].dataset.action === 'clear') {
        return '';
      }
      if (element.id === 'dateOperator') {
        const date = (document.getElementById('date') as HTMLInputElement).value;
        const dateTo = (document.getElementById('dateTo') as HTMLInputElement).value;
        if (date === '') {
          return '';
        }
        if (dateTo === '') {
          return getOperator() + date;
        }
        return date + '..' + dateTo;
      }
      // filter on owner
      if (element.getAttribute('name') === 'owner') {
        return `${element.options[element.selectedIndex].value}`;
      }
      return `${element.options[element.selectedIndex].text}`;
    }
    if (element instanceof HTMLInputElement) {
      if (element.id === 'date') {
        if (element.value === '') {
          return '';
        }
        const dateTo = (document.getElementById('dateTo') as HTMLInputElement).value;
        if (dateTo === '') {
          return getOperator() + element.value;
        }
        return element.value + '..' + dateTo;
      }
      if (element.id === 'dateTo') {
        const date = (document.getElementById('date') as HTMLInputElement).value;
        if (date === '') {
          return '';
        }
        if (element.value === '') {
          return getOperator() + date;
        }
        return date + '..' + element.value;
      }
    }
    return '😶';
  }

  // add a change event listener to all elements that helps constructing the query string
  document.querySelectorAll('.filterHelper').forEach(el => {
    el.addEventListener('change', event => {
      const elem = event.currentTarget as HTMLElement;
      const curVal = extendedArea.value;

      const hasInput = curVal.length != 0;
      const hasSpace = curVal.endsWith(' ');
      const addSpace = hasInput ? (hasSpace ? '' : ' ') : '';

      // look if the filter key already exists in the extendedArea
      // paste the regex on regex101.com to understand it, note that here \ need to be escaped
      const regex = new RegExp(elem.dataset.filter + ':(?:(?:"((?:\\\\"|(?:(?!")).)+)")|(?:\'((?:\\\\\'|(?:(?!\')).)+)\')|[\\S]+)\\s?');
      const found = curVal.match(regex);
      // don't add quotes unless we need them (space exists)
      let quotes = '';
      let filterValue = getFilterValueFromElement(elem);
      if (filterValue.includes(' ')) {
        quotes = '"';
      }
      // default value is clearing everything
      let filter = '';
      // but if we have a correct value, we add the filter
      if (filterValue !== '') {
        let filterName = elem.dataset.filter;

        if (filterName === '(?:author|group)') {
          filterName = filterValue.split(':')[0];
          filterValue = filterValue.substring(filterName.length + 1);
        }

        filter = `${filterName}:${quotes}${filterValue}${quotes}`;
      }

      // add additional filter at cursor position
      if (key.ctrl || key.command) {
        const pos = extendedArea.selectionStart;
        const val = extendedArea.value;
        const start = val.substring(0, pos);
        const end = val.substring(pos, val.length);
        const hasSpaceBefore = val.substring(pos - 1, pos) === ' ';
        const hasSpaceAfter = val.substring(pos, pos + 1) === ' ';
        const insert = (hasSpaceBefore ? '' : pos === 0 ? '' : ' ') + filter + (hasSpaceAfter ? '' : ' ');
        extendedArea.value = start + insert + end;
        return;
      }

      if (found) {
        extendedArea.value = curVal.replace(regex, filter + (filter === '' ? '' : ' '));
      } else {
        extendedArea.value = extendedArea.value + addSpace + filter;
      }
    });
  });
});
