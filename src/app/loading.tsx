import React from 'react'
import { SyncLoader} from "react-spinners";

export default function Loading() {
    
return  <div className='flex items-center justify-center min-h-screen bg-gray-100'>
    <SyncLoader
        color="#2563eb"
        loading={true}
        size={15}
        aria-label="Loading Spinner"
        data-testid="loader"
        className='mx-auto '
      />
</div>
}
