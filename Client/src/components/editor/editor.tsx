import { memo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { InputAssetProps, StudioEditor } from "@grapesjs/studio-sdk/react";
import { OrganizerCompetition } from "@/services/organizerService";
import type {Asset, Editor, ProjectData} from "grapesjs";
import '@grapesjs/studio-sdk/style';

type EditorProps = {
  getExportData: (editor: Editor) => void;
  uploadAssets: (files: File[]) => Promise<InputAssetProps[]>;
  deleteAssets: (assets: Asset[]) => void;
  getAssets: () => Promise<InputAssetProps[]>;
  saveLandingPage: (project: ProjectData) => void;
  initialProjectData: ProjectData;
};

export default function PageEditor({ getExportData, uploadAssets, deleteAssets, getAssets, saveLandingPage, initialProjectData }: EditorProps) {

  return <StudioEditor
          options={{
        licenseKey: '8fedb98a1263429db09e2ccf5ea68dad71d9b490487a4940b9e6dcd91ca5c14d',
      theme: 'light',
      pages:false,
      layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'sidebarLeft' },
          { 
            type: 'canvasSidebarTop', 
            sidebarTop: {
              leftContainer: {
                buttons: ({ items }) => [
                      ...items,
                      {
                        id: 'publishWebsiteProd',
                        type: 'button',
                        icon: '<svg viewBox="0 0 24 24"><path d="m13.13 22.19-1.63-3.83a21.05 21.05 0 0 0 4.4-2.27l-2.77 6.1M5.64 12.5l-3.83-1.63 6.1-2.77a21.05 21.05 0 0 0-2.27 4.4M21.61 2.39S16.66.27 11 5.93a19.82 19.82 0 0 0-4.35 6.71c-.28.75-.09 1.57.46 2.13l2.13 2.12c.55.56 1.37.74 2.12.46A19.1 19.1 0 0 0 18.07 13c5.66-5.66 3.54-10.61 3.54-10.61m-7.07 7.07a2 2 0 0 1 2.83-2.83 2 2 0 0 1-2.83 2.83m-5.66 7.07-1.41-1.41 1.41 1.41M6.24 22l3.64-3.64a3.06 3.06 0 0 1-.97-.45L4.83 22h1.41M2 22h1.41l4.77-4.76-1.42-1.41L2 20.59V22m0-2.83 4.09-4.08c-.21-.3-.36-.62-.45-.97L2 17.76v1.41Z"/></svg>',
                        tooltip: 'Publish website ',
                        onClick: ({ editor }) => getExportData(editor),
                      },
                    ]
              }
            }
          },
          { type: 'sidebarRight' }
        ]
      },
    },
      project: {
        type: 'web',
        default:{
          pages: [
            { name: 'Home', component: '<h1>Fallback Project, reload to retry</h1>' },
          ]
        }
      },
      
      assets: {
        storageType: 'self',
        // Provide a custom upload handler for assets
        onUpload: async ({ files}) => {
          return await uploadAssets(files);
        },
        // Provide a custom handler for deleting assets
        onDelete: async ({ assets }) => {
          deleteAssets(assets);
        },
        onLoad: async () => {
          return await getAssets();
        },
        
      },
      storage: {
        type: 'self',
        // Provide a custom handler for saving the project data.
        onSave: async ({ project }) => {
          saveLandingPage(project);
        },
        // Provide a custom handler for loading project data.
        onLoad: async () => {
          return { project: initialProjectData };
        },
        autosaveChanges: 50,
        autosaveIntervalMs: 100000
      },
      
      }}
        />;
};