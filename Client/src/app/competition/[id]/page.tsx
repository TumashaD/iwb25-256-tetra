'use client';
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('element.ref was removed')) {
    return; // Suppress this specific warning
  }
  originalConsoleError.apply(console, args);
};
console.log('Suppressing React 19 ref warnings');
import {InputAssetProps, StudioEditor,} from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { OrganizerService } from '@/services/organizerService';
import { useParams } from 'next/navigation';


export default function Competition() {
  const param = useParams();
  const competitionId = param.id ? Number(param.id) : undefined;
  return (
      <div className="h-screen">
        <StudioEditor
          options={{
        licenseKey: '8fedb98a1263429db09e2ccf5ea68dad71d9b490487a4940b9e6dcd91ca5c14d',
      theme: 'light',
      pages:false,
      project: {
        type: 'web',
      },
      assets: {
        storageType: 'self',
        // Provide a custom upload handler for assets
        onUpload: async ({ files }) => {
          if (typeof competitionId === 'number') {
            const result = await OrganizerService.uploadAssets(competitionId, files);
            console.log('Assets uploaded:', result);
            // Ensure result is an array of InputAssetProps
            if (Array.isArray(result)) {
              return result as InputAssetProps[];
            } else {
              // If result is not an array, return an empty array
              return [];
            }
          } else {
            console.error('Invalid competitionId:', competitionId);
            return [];
          }
        },
        // Provide a custom handler for deleting assets
        onDelete: async ({ assets }) => {
          const assetSrcs: string[] = assets.map(asset => asset.getSrc());
          console.log('Deleting assets:', assetSrcs);
          if (typeof competitionId === 'number') {
            await OrganizerService.deleteAssets(competitionId, assetSrcs);
          } else {
            console.error('Invalid competitionId:', competitionId);
          }
        },
        onLoad: async () => {
          if (typeof competitionId === 'number') {
            const assets = await OrganizerService.getAssets(competitionId);
            console.log('Loaded assets:', assets);
            // Ensure assets is an array of InputAssetProps or Asset
            if (Array.isArray(assets)) {
              return assets as InputAssetProps[];
            } else {
              return [];
            }
          } else {
            console.error('Invalid competitionId:', competitionId);
            return [];
          }
        }
      },
      storage: {
        type: 'self',
        // Provide a custom handler for saving the project data.
        onSave: async ({ project }) => {
          if (typeof competitionId === 'number') {
            OrganizerService.saveLandingPage(competitionId, project);
          } else {
            console.error('Invalid competitionId:', competitionId);
          }
        },
        // Provide a custom handler for loading project data.
        onLoad: async () => {
          if (typeof competitionId === 'number') {
            const project = await OrganizerService.getLandingPage(competitionId);
            return { project };
          } else {
            console.error('Invalid competitionId:', competitionId);
            // Return a default/empty project object to satisfy ProjectDataResult type
            return { project: {} };
          }
        },
        autosaveChanges: 5,
        autosaveIntervalMs: 10000
      }
      }}
        />
      </div>
  );
}
