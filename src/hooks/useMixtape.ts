import { useContext } from 'react';
import { MixtapeContext } from '../contexts/MixtapeContext';

export const useMixtape = () => {
  return useContext(MixtapeContext);
};