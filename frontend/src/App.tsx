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
  const [menu, setMenu] = useState("landing");
  const ref = React.useRef(null);

  return (
    <>
      <Center>
        <Container
          w={["95%", "60%"]}
          maxW={"500px"}
          shadow={"sm"}
          mt="1vh"
          mb="1vh"
          border={"1px solid"}
          borderColor={"gray.200"}
          borderRadius={"3xl"}
          height={"98vh"}
          padding={"0px"}
          backgroundColor={"brand"}
          overflow={"hidden"}
        >
          <Header />
          {menu === "landing" ? <LandingPage /> : <Wallet />}
        </Container>
      </Center>
    </>
  );
}

export default App;
