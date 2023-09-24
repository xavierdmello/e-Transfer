import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import React from "react";
import { ref, update, set, onValue, get } from "firebase/database";
import Header from "./components/Header.tsx";
import LandingPage from "./components/LandingPage.tsx";
import Wallet from "./components/Wallet.tsx";

import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  Box,
  UnorderedList,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
} from "@chakra-ui/react";

function App() {
  const { login, authenticated, user, ready, logout, createWallet } = usePrivy();
  const [menu, setMenu] = useState("welcome");
  const ref = React.useRef(null);
  
  return (
    <>
      <Center>
        <Container
          w={["95%", "75%"]}
          maxW={"800px"}
          shadow={"sm"}
          mt="1vh"
          mb="1vh"
          border={"1px solid"}
          borderColor={"gray.200"}
          borderRadius={"3xl"}
          height={"98vh"}
          padding={"0px"}
          position={"relative"}
        >
          {/* Main Content */}
          
          <Box zIndex={"100"} height={"100%"} width={"100%"} borderRadius={"3xl"}display={"block"}>
            <Header />
            <LandingPage/>
            <h1>dasds</h1>
          </Box>

          {/* Fancy bg */}
          <Box
            m="0"
            zIndex={"-100"}
            top={0}
            left={0}
            borderTopRadius={"3xl"}
            p="0"
            height="20%"
            position={"absolute"}
            backgroundColor={"brand"}
            width={"100%"}
          ></Box>
        </Container>
      </Center>
    </>
  );
}

export default App;
