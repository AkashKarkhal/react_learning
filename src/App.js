import * as React from 'react';
import PropTypes from 'prop-types';
import { createTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { Crud, DataSourceCache } from '@toolpad/core/Crud';
import { DemoProvider, useDemoRouter } from '@toolpad/core/internal';
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-toolpad-color-scheme',
  },
  colorSchemes: { light: true, dark: true },
});

const getStoredNotes = () => {
  const stored = localStorage.getItem('notes');
  return stored ? JSON.parse(stored) : [
    { id: 1, title: 'Grocery List Item', text: 'Buy more coffee.' },
    { id: 2, title: 'Personal Goal', text: 'Finish reading the book.' },
  ];
};

const saveNotes = (notes) => {
  localStorage.setItem('notes', JSON.stringify(notes));
};

let notesStore = getStoredNotes();

export const notesDataSource = {
  fields: [
    { field: 'id', headerName: 'ID' },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'text', headerName: 'Text', flex: 1 },
  ],

  getMany: async ({ paginationModel, filterModel, sortModel }) => {
    await new Promise((r) => setTimeout(r, 300));
    let processedNotes = [...notesStore];

    // Filtering
    if (filterModel?.items?.length) {
      filterModel.items.forEach(({ field, value, operator }) => {
        if (!field || value == null) return;
        processedNotes = processedNotes.filter((note) => {
          const noteValue = note[field];
          switch (operator) {
            case 'contains':
              return String(noteValue).toLowerCase().includes(String(value).toLowerCase());
            case 'equals':
              return noteValue === value;
            case 'startsWith':
              return String(noteValue).toLowerCase().startsWith(String(value).toLowerCase());
            case 'endsWith':
              return String(noteValue).toLowerCase().endsWith(String(value).toLowerCase());
            case '>':
              return noteValue > value;
            case '<':
              return noteValue < value;
            default:
              return true;
          }
        });
      });
    }

    // Sorting
    if (sortModel?.length) {
      processedNotes.sort((a, b) => {
        for (const { field, sort } of sortModel) {
          if (a[field] < b[field]) return sort === 'asc' ? -1 : 1;
          if (a[field] > b[field]) return sort === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    const paginatedNotes = processedNotes.slice(start, end);

    return { items: paginatedNotes, itemCount: processedNotes.length };
  },

  getOne: async (noteId) => {
    await new Promise((r) => setTimeout(r, 300));
    const note = notesStore.find((n) => n.id === Number(noteId));
    if (!note) throw new Error('Note not found');
    return note;
  },

  createOne: async (data) => {
    await new Promise((r) => setTimeout(r, 300));
    const newNote = {
      id: notesStore.reduce((max, n) => Math.max(max, n.id), 0) + 1,
      ...data,
    };
    notesStore = [...notesStore, newNote];
    saveNotes(notesStore);
    return newNote;
  },

  updateOne: async (noteId, data) => {
    await new Promise((r) => setTimeout(r, 300));
    let updated = null;
    notesStore = notesStore.map((n) => {
      if (n.id === Number(noteId)) {
        updated = { ...n, ...data };
        return updated;
      }
      return n;
    });
    if (!updated) throw new Error('Note not found');
    saveNotes(notesStore);
    return updated;
  },

  deleteOne: async (noteId) => {
    await new Promise((r) => setTimeout(r, 300));
    notesStore = notesStore.filter((n) => n.id !== Number(noteId));
    saveNotes(notesStore);
  },

  validate: (formValues) => {
    const issues = [];
    if (!formValues.title) issues.push({ message: 'Title is required', path: ['title'] });
    else if (formValues.title.length < 3)
      issues.push({ message: 'Title must be at least 3 characters', path: ['title'] });

    if (!formValues.text) issues.push({ message: 'Text is required', path: ['text'] });
    return { issues };
  },
};

const cache = new DataSourceCache();

function CrudApp({ window }) {
  const router = useDemoRouter('/notes');
  const demoWindow = window !== undefined ? window() : undefined;

  return (
    <DemoProvider window={demoWindow}>
      <AppProvider router={router} theme={theme} window={demoWindow}>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="primary">
            <Toolbar>
              <img src="/logo.png" alt="logo" height={30} style={{ marginRight: 12 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Toolpad
              </Typography>
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Crud
              dataSource={notesDataSource}
              dataSourceCache={cache}
              rootPath="/notes"
              initialPageSize={10}
              defaultValues={{ title: 'New note' }}
              pageTitles={{
                create: 'New Note',
                edit: 'Edit Note',
                show: 'Note Details',
              }}
            />
          </Container>
        </Box>
      </AppProvider>
    </DemoProvider>
  );
}

CrudApp.propTypes = {
  window: PropTypes.func,
};

export default CrudApp;
